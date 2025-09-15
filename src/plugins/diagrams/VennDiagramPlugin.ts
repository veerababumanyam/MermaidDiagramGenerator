/**
 * Venn Diagram Plugin
 * Implements area-proportional Venn diagrams using DeepVenn-inspired algorithms
 */

import type {
  DiagramPlugin,
  DiagramRenderer,
  AIEnhancer,
  DiagramValidator,
  DiagramData,
  RenderConfig,
  RenderResult,
  Bounds,
  ValidationResult,
  AIAnalysis,
  AISuggestion,
  VennData,
  VennSet,
  VennIntersection,
  Position,
  Size
} from '../../types/diagrams';

export class VennDiagramRenderer implements DiagramRenderer {
  private svgNS = 'http://www.w3.org/2000/svg';

  async render(data: DiagramData, config: RenderConfig): Promise<RenderResult> {
    const vennData = data as VennData;
    const element = document.createElement('div');
    element.className = 'venn-diagram-container';

    const svg = this.createSVGElement('svg', {
      width: config.width || 800,
      height: config.height || 600,
      viewBox: '0 0 800 600',
      class: 'venn-diagram'
    });

    // Calculate optimal positions for sets
    const positions = this.calculateSetPositions(vennData.sets);

    // Render sets
    vennData.sets.forEach((set, index) => {
      const circle = this.createSetCircle(set, positions[index], config);
      svg.appendChild(circle);

      // Add label
      const label = this.createSetLabel(set, positions[index]);
      svg.appendChild(label);
    });

    // Render intersections if available
    if (vennData.intersections) {
      vennData.intersections.forEach(intersection => {
        const intersectionElement = this.createIntersectionArea(intersection, vennData.sets, positions);
        if (intersectionElement) {
          svg.appendChild(intersectionElement);
        }
      });
    }

    element.appendChild(svg);

    const bounds = this.getBounds(vennData, config);

    return {
      element,
      svg: svg.outerHTML,
      bounds,
      metadata: {
        renderTime: Date.now(),
        nodeCount: vennData.sets.length,
        edgeCount: vennData.intersections?.length || 0,
        warnings: [],
        errors: []
      }
    };
  }

  async update(element: HTMLElement, data: DiagramData, config: RenderConfig): Promise<void> {
    // Clear existing content
    element.innerHTML = '';

    // Re-render
    const result = await this.render(data, config);
    element.appendChild(result.element);
  }

  destroy(element: HTMLElement): void {
    element.innerHTML = '';
  }

  getBounds(data: DiagramData, config: RenderConfig): Bounds {
    return {
      x: 0,
      y: 0,
      width: config.width || 800,
      height: config.height || 600
    };
  }

  private calculateSetPositions(sets: VennSet[]): Position[] {
    const centerX = 400;
    const centerY = 300;

    if (sets.length === 2) {
      // Two circles side by side
      return [
        { x: centerX - 120, y: centerY },
        { x: centerX + 120, y: centerY }
      ];
    } else if (sets.length === 3) {
      // Three circles in triangle formation
      const radius = 100;
      return [
        { x: centerX, y: centerY - radius },
        { x: centerX - radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) },
        { x: centerX + radius * Math.cos(Math.PI / 6), y: centerY + radius * Math.sin(Math.PI / 6) }
      ];
    }

    // Default single circle
    return [{ x: centerX, y: centerY }];
  }

  private createSetCircle(set: VennSet, position: Position, config: RenderConfig): SVGElement {
    const circle = this.createSVGElement('circle', {
      cx: position.x,
      cy: position.y,
      r: set.radius,
      fill: set.color,
      stroke: this.darkenColor(set.color, 0.2),
      'stroke-width': '2',
      opacity: '0.7',
      class: 'venn-set'
    });

    // Add interactivity
    circle.addEventListener('mouseover', () => {
      circle.style.opacity = '0.9';
    });

    circle.addEventListener('mouseout', () => {
      circle.style.opacity = '0.7';
    });

    return circle;
  }

  private createSetLabel(set: VennSet, position: Position): SVGElement {
    const text = this.createSVGElement('text', {
      x: position.x,
      y: position.y,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: '#000000',
      'font-size': '14',
      'font-weight': 'bold',
      class: 'venn-label'
    });

    text.textContent = set.label;
    return text;
  }

  private createIntersectionArea(
    intersection: VennIntersection,
    sets: VennSet[],
    positions: Position[]
  ): SVGElement | null {
    if (intersection.sets.length !== 2) {
      // For now, only support 2-set intersections
      return null;
    }

    const [set1Id, set2Id] = intersection.sets;
    const set1 = sets.find(s => s.id === set1Id);
    const set2 = sets.find(s => s.id === set2Id);

    if (!set1 || !set2) return null;

    const pos1 = positions[sets.indexOf(set1)];
    const pos2 = positions[sets.indexOf(set2)];

    // Calculate intersection area (simplified)
    const pathData = this.calculateIntersectionPath(pos1, pos2, set1.radius, set2.radius);

    const path = this.createSVGElement('path', {
      d: pathData,
      fill: this.mixColors(set1.color, set2.color),
      stroke: this.darkenColor(this.mixColors(set1.color, set2.color), 0.2),
      'stroke-width': '1',
      opacity: '0.8',
      class: 'venn-intersection'
    });

    return path;
  }

  private calculateIntersectionPath(pos1: Position, pos2: Position, r1: number, r2: number): string {
    // Simplified intersection calculation
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= r1 + r2) return ''; // No intersection

    // Calculate intersection points (simplified)
    const a = (r1 * r1 - r2 * r2 + distance * distance) / (2 * distance);
    const h = Math.sqrt(r1 * r1 - a * a);

    const xm = pos1.x + (a * dx) / distance;
    const ym = pos1.y + (a * dy) / distance;

    const xs1 = xm + (h * dy) / distance;
    const ys1 = ym - (h * dx) / distance;
    const xs2 = xm - (h * dy) / distance;
    const ys2 = ym + (h * dx) / distance;

    // Create path for intersection area
    return `M ${xs1} ${ys1} A ${r1} ${r1} 0 0 1 ${xs2} ${ys2} A ${r2} ${r2} 0 0 0 ${xs1} ${ys1} Z`;
  }

  private createSVGElement(tagName: string, attributes: Record<string, string | number> = {}): SVGElement {
    const element = document.createElementNS(this.svgNS, tagName) as SVGElement;

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value.toString());
    });

    return element;
  }

  private darkenColor(color: string, factor: number): string {
    // Simple color darkening (could be enhanced with proper color manipulation)
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  private mixColors(color1: string, color2: string): string {
    // Simple color mixing
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r = Math.round((parseInt(hex1.substr(0, 2), 16) + parseInt(hex2.substr(0, 2), 16)) / 2);
    const g = Math.round((parseInt(hex1.substr(2, 2), 16) + parseInt(hex2.substr(2, 2), 16)) / 2);
    const b = Math.round((parseInt(hex1.substr(4, 2), 16) + parseInt(hex2.substr(4, 2), 16)) / 2);

    return `rgb(${r}, ${g}, ${b})`;
  }
}

export class VennDiagramValidator implements DiagramValidator {
  validate(data: DiagramData, type: string): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    const vennData = data as VennData;

    // Validate sets
    if (!vennData.sets || vennData.sets.length === 0) {
      errors.push({
        message: 'Venn diagram must have at least one set',
        severity: 'error'
      });
    }

    if (vennData.sets && vennData.sets.length > 3) {
      warnings.push({
        message: 'Venn diagrams with more than 3 sets may be complex to interpret',
        severity: 'warning',
        suggestion: 'Consider using Euler diagrams for better clarity'
      });
    }

    // Validate set properties
    vennData.sets?.forEach((set, index) => {
      if (!set.id) {
        errors.push({
          message: `Set at index ${index} must have an ID`,
          severity: 'error'
        });
      }

      if (!set.label) {
        errors.push({
          message: `Set "${set.id}" must have a label`,
          severity: 'error'
        });
      }

      if (set.size < 0) {
        errors.push({
          message: `Set "${set.id}" size must be non-negative`,
          severity: 'error'
        });
      }

      if (set.radius <= 0) {
        errors.push({
          message: `Set "${set.id}" radius must be positive`,
          severity: 'error'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getSchema(type: string): any {
    return {
      type: 'object',
      properties: {
        sets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              size: { type: 'number', minimum: 0 },
              color: { type: 'string' },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' }
                }
              },
              radius: { type: 'number', minimum: 0 }
            },
            required: ['id', 'label', 'size', 'color', 'radius']
          }
        },
        intersections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sets: {
                type: 'array',
                items: { type: 'string' }
              },
              size: { type: 'number', minimum: 0 },
              label: { type: 'string' }
            }
          }
        }
      },
      required: ['sets']
    };
  }
}

export class VennDiagramAIEnhancer implements AIEnhancer {
  async analyze(data: DiagramData): Promise<AIAnalysis> {
    const vennData = data as VennData;
    const setCount = vennData.sets.length;
    const hasIntersections = (vennData.intersections?.length || 0) > 0;

    let complexity = 0.3; // Base complexity
    if (setCount > 2) complexity += 0.2;
    if (hasIntersections) complexity += 0.3;
    if (setCount > 3) complexity += 0.2;

    const readability = hasIntersections ? 0.7 : 0.9;
    const completeness = vennData.sets.every(set => set.label && set.size > 0) ? 0.9 : 0.6;

    const suggestions: AISuggestion[] = [];

    if (!hasIntersections) {
        suggestions.push({
          type: 'structure',
          priority: 'medium',
          message: 'Consider adding intersection data to show relationships between sets',
          confidence: 0.8,
          action: {
            type: 'create' as ActionType,
            payload: { type: 'intersections' },
            description: 'Add intersection areas'
          }
        });
    }

    if (setCount > 3) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        message: 'Complex Venn diagrams may be hard to interpret. Consider using Euler diagrams instead.',
        confidence: 0.9,
        action: {
          type: 'generate' as ActionType,
          payload: { type: 'euler' },
          description: 'Convert to Euler diagram'
        }
      });
    }

    return {
      complexity,
      readability,
      completeness,
      suggestions,
      optimizations: []
    };
  }

  async optimize(data: DiagramData): Promise<DiagramData> {
    const vennData = data as VennData;

    // Optimize set positions for better intersection visibility
    const optimizedSets = vennData.sets.map(set => ({
      ...set,
      radius: Math.max(set.radius, Math.sqrt(set.size) * 10) // Scale radius by size
    }));

    return {
      ...vennData,
      sets: optimizedSets
    };
  }

  async suggest(data: DiagramData): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    const vennData = data as VennData;

    // Suggest color improvements
    const colors = vennData.sets.map(s => s.color);
    if (new Set(colors).size !== colors.length) {
      suggestions.push({
        type: 'style',
        priority: 'medium',
        message: 'Consider using distinct colors for better differentiation',
        confidence: 0.7,
        action: {
          type: 'style' as ActionType,
          payload: { target: 'sets', property: 'color' },
          description: 'Update set colors'
        }
      });
    }

    // Suggest size-based radius adjustment
    const hasSizeDiscrepancy = vennData.sets.some(set =>
      Math.abs(set.radius - Math.sqrt(set.size) * 10) > 20
    );

    if (hasSizeDiscrepancy) {
      suggestions.push({
        type: 'layout',
        priority: 'low',
        message: 'Circle sizes could better represent set sizes for accurate area-proportional display',
        confidence: 0.6,
        action: {
          type: 'optimize' as ActionType,
          payload: { type: 'size' },
          description: 'Adjust circle sizes'
        }
      });
    }

    return suggestions;
  }

  async validate(data: DiagramData): Promise<ValidationResult> {
    const validator = new VennDiagramValidator();
    return validator.validate(data, 'venn');
  }
}

// Export the complete Venn diagram plugin
export const VennDiagramPlugin: DiagramPlugin = {
  id: 'venn-diagram',
  name: 'Venn Diagram',
  version: '1.0.0',
  type: 'venn',
  description: 'Create area-proportional Venn diagrams for visualizing set relationships',
  author: 'Mermaid Diagram Generator',
  renderer: new VennDiagramRenderer(),
  aiEnhancer: new VennDiagramAIEnhancer(),
  validator: new VennDiagramValidator(),
  config: {
    theme: 'default',
    responsive: true,
    interactive: true
  },
  supportedFormats: ['svg', 'png', 'pdf']
};
