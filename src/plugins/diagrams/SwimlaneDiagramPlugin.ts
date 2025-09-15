/**
 * Swimlane Diagram Plugin
 * Process flow visualization with role-based lanes and phases
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
  SwimlaneData,
  Swimlane,
  SwimlanePhase,
  Position,
  Size
} from '../../types/diagrams';

export class SwimlaneDiagramRenderer implements DiagramRenderer {
  private svgNS = 'http://www.w3.org/2000/svg';

  async render(data: DiagramData, config: RenderConfig): Promise<RenderResult> {
    const swimlaneData = data as SwimlaneData;
    const element = document.createElement('div');
    element.className = 'swimlane-diagram-container';

    const svg = this.createSVGElement('svg', {
      width: config.width || 1200,
      height: config.height || 800,
      viewBox: '0 0 1200 800',
      class: 'swimlane-diagram'
    });

    // Calculate layout
    const layout = this.calculateLayout(swimlaneData, config);

    // Render lanes
    swimlaneData.lanes.forEach((lane, index) => {
      const laneElement = this.createLane(lane, layout.laneHeight, layout.laneWidth, index, config);
      svg.appendChild(laneElement);
    });

    // Render phases (vertical dividers)
    if (swimlaneData.phases) {
      swimlaneData.phases.forEach(phase => {
        const phaseElement = this.createPhase(phase, layout, config);
        svg.appendChild(phaseElement);
      });
    }

    // Render nodes within lanes
    swimlaneData.nodes.forEach(node => {
      const nodeElement = this.createNode(node, swimlaneData.lanes, layout, config);
      svg.appendChild(nodeElement);
    });

    // Render edges
    swimlaneData.edges.forEach(edge => {
      const edgeElement = this.createEdge(edge, swimlaneData.nodes, layout, config);
      svg.appendChild(edgeElement);
    });

    element.appendChild(svg);

    const bounds = this.getBounds(swimlaneData, config);

    return {
      element,
      svg: svg.outerHTML,
      bounds,
      metadata: {
        renderTime: Date.now(),
        nodeCount: swimlaneData.nodes.length,
        edgeCount: swimlaneData.edges.length,
        warnings: [],
        errors: []
      }
    };
  }

  async update(element: HTMLElement, data: DiagramData, config: RenderConfig): Promise<void> {
    element.innerHTML = '';
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
      width: config.width || 1200,
      height: config.height || 800
    };
  }

  private calculateLayout(data: SwimlaneData, config: RenderConfig) {
    const laneCount = data.lanes.length;
    const totalHeight = config.height || 800;
    const totalWidth = config.width || 1200;

    const laneHeight = totalHeight / laneCount;
    const laneWidth = totalWidth;

    return {
      laneHeight,
      laneWidth,
      totalHeight,
      totalWidth,
      headerHeight: 40,
      phaseWidth: 100
    };
  }

  private createLane(lane: Swimlane, height: number, width: number, index: number, config: RenderConfig): SVGElement {
    const y = index * height;

    // Lane background
    const background = this.createSVGElement('rect', {
      x: '0',
      y: y.toString(),
      width: width.toString(),
      height: height.toString(),
      fill: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
      stroke: '#dee2e6',
      'stroke-width': '1',
      class: 'swimlane-background'
    });

    // Lane header
    const headerBg = this.createSVGElement('rect', {
      x: '0',
      y: y.toString(),
      width: '200',
      height: '40',
      fill: '#e9ecef',
      stroke: '#dee2e6',
      'stroke-width': '1',
      class: 'swimlane-header'
    });

    // Lane label
    const label = this.createSVGElement('text', {
      x: '100',
      y: (y + 25).toString(),
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: '#495057',
      'font-size': '14',
      'font-weight': 'bold',
      class: 'swimlane-label'
    });
    label.textContent = lane.label;

    const group = this.createSVGElement('g', { class: 'swimlane' });
    group.appendChild(background);
    group.appendChild(headerBg);
    group.appendChild(label);

    return group;
  }

  private createPhase(phase: SwimlanePhase, layout: any, config: RenderConfig): SVGElement {
    const x = 200 + (phase.startPosition * layout.phaseWidth);

    const line = this.createSVGElement('line', {
      x1: x.toString(),
      y1: '0',
      x2: x.toString(),
      y2: layout.totalHeight.toString(),
      stroke: '#6c757d',
      'stroke-width': '2',
      'stroke-dasharray': '5,5',
      class: 'swimlane-phase'
    });

    // Phase label
    const label = this.createSVGElement('text', {
      x: (x + 10).toString(),
      y: '20',
      fill: '#495057',
      'font-size': '12',
      'font-weight': 'bold',
      class: 'phase-label'
    });
    label.textContent = phase.label;

    const group = this.createSVGElement('g', { class: 'phase' });
    group.appendChild(line);
    group.appendChild(label);

    return group;
  }

  private createNode(node: any, lanes: Swimlane[], layout: any, config: RenderConfig): SVGElement {
    const lane = lanes.find(l => l.id === node.laneId);
    if (!lane) return this.createSVGElement('g');

    const laneIndex = lanes.indexOf(lane);
    const laneY = laneIndex * layout.laneHeight;
    const nodeX = 250 + (node.position?.x || 0);
    const nodeY = laneY + layout.headerHeight + (node.position?.y || 0);

    let shape: SVGElement;

    switch (node.type) {
      case 'start':
        shape = this.createSVGElement('circle', {
          cx: nodeX.toString(),
          cy: nodeY.toString(),
          r: '20',
          fill: '#28a745',
          stroke: '#1e7e34',
          'stroke-width': '2'
        });
        break;

      case 'end':
        shape = this.createSVGElement('circle', {
          cx: nodeX.toString(),
          cy: nodeY.toString(),
          r: '20',
          fill: '#dc3545',
          stroke: '#bd2130',
          'stroke-width': '2'
        });
        break;

      case 'decision':
        shape = this.createSVGElement('polygon', {
          points: `${nodeX-25},${nodeY} ${nodeX},${nodeY-25} ${nodeX+25},${nodeY} ${nodeX},${nodeY+25}`,
          fill: '#ffc107',
          stroke: '#e0a800',
          'stroke-width': '2'
        });
        break;

      default: // process
        shape = this.createSVGElement('rect', {
          x: (nodeX - 40).toString(),
          y: (nodeY - 20).toString(),
          width: '80',
          height: '40',
          rx: '5',
          fill: '#007bff',
          stroke: '#0056b3',
          'stroke-width': '2'
        });
    }

    // Node label
    const label = this.createSVGElement('text', {
      x: nodeX.toString(),
      y: (nodeY + 40).toString(),
      'text-anchor': 'middle',
      fill: '#ffffff',
      'font-size': '12',
      'font-weight': 'bold',
      class: 'node-label'
    });
    label.textContent = node.label;

    const group = this.createSVGElement('g', { class: 'swimlane-node' });
    group.appendChild(shape);
    group.appendChild(label);

    return group;
  }

  private createEdge(edge: any, nodes: any[], layout: any, config: RenderConfig): SVGElement {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return this.createSVGElement('g');

    const sourceLane = layout.lanes?.find((l: Swimlane) => l.id === sourceNode.laneId);
    const targetLane = layout.lanes?.find((l: Swimlane) => l.id === targetNode.laneId);

    if (!sourceLane || !targetLane) return this.createSVGElement('g');

    const sourceIndex = layout.lanes.indexOf(sourceLane);
    const targetIndex = layout.lanes.indexOf(targetLane);

    const sourceX = 250 + (sourceNode.position?.x || 0);
    const sourceY = sourceIndex * layout.laneHeight + layout.headerHeight + (sourceNode.position?.y || 0);
    const targetX = 250 + (targetNode.position?.x || 0);
    const targetY = targetIndex * layout.laneHeight + layout.headerHeight + (targetNode.position?.y || 0);

    const path = this.createSVGElement('path', {
      d: `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`,
      stroke: '#6c757d',
      'stroke-width': '2',
      fill: 'none',
      'marker-end': 'url(#arrowhead)',
      class: 'swimlane-edge'
    });

    // Arrow marker
    const defs = this.createSVGElement('defs');
    const marker = this.createSVGElement('marker', {
      id: 'arrowhead',
      markerWidth: '10',
      markerHeight: '7',
      refX: '9',
      refY: '3.5',
      orient: 'auto'
    });
    const arrow = this.createSVGElement('polygon', {
      points: '0 0, 10 3.5, 0 7',
      fill: '#6c757d'
    });
    marker.appendChild(arrow);
    defs.appendChild(marker);

    const group = this.createSVGElement('g', { class: 'edge' });
    group.appendChild(defs);
    group.appendChild(path);

    return group;
  }

  private createSVGElement(tagName: string, attributes: Record<string, string | number> = {}): SVGElement {
    const element = document.createElementNS(this.svgNS, tagName) as SVGElement;

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value.toString());
    });

    return element;
  }
}

export class SwimlaneDiagramValidator implements DiagramValidator {
  validate(data: DiagramData, type: string): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    const swimlaneData = data as SwimlaneData;

    // Validate lanes
    if (!swimlaneData.lanes || swimlaneData.lanes.length === 0) {
      errors.push({
        message: 'Swimlane diagram must have at least one lane',
        severity: 'error'
      });
    }

    // Validate nodes have valid lane references
    swimlaneData.nodes?.forEach(node => {
      const laneExists = swimlaneData.lanes?.some(lane => lane.id === node.laneId);
      if (!laneExists) {
        errors.push({
          message: `Node "${node.label}" references non-existent lane "${node.laneId}"`,
          severity: 'error'
        });
      }
    });

    // Validate edges reference valid nodes
    swimlaneData.edges?.forEach(edge => {
      const sourceExists = swimlaneData.nodes?.some(node => node.id === edge.source);
      const targetExists = swimlaneData.nodes?.some(node => node.id === edge.target);

      if (!sourceExists) {
        errors.push({
          message: `Edge references non-existent source node "${edge.source}"`,
          severity: 'error'
        });
      }
      if (!targetExists) {
        errors.push({
          message: `Edge references non-existent target node "${edge.target}"`,
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
        lanes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              type: { type: 'string', enum: ['pool', 'lane'] }
            },
            required: ['id', 'label', 'type']
          }
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              laneId: { type: 'string' },
              startPosition: { type: 'number' },
              endPosition: { type: 'number' }
            }
          }
        }
      },
      required: ['lanes']
    };
  }
}

export class SwimlaneDiagramAIEnhancer implements AIEnhancer {
  async analyze(data: DiagramData): Promise<AIAnalysis> {
    const swimlaneData = data as SwimlaneData;
    const laneCount = swimlaneData.lanes.length;
    const nodeCount = swimlaneData.nodes.length;
    const hasPhases = (swimlaneData.phases?.length || 0) > 0;

    let complexity = 0.4; // Base complexity
    if (laneCount > 3) complexity += 0.2;
    if (nodeCount > 10) complexity += 0.2;
    if (hasPhases) complexity += 0.1;

    const readability = laneCount <= 5 && nodeCount <= 15 ? 0.8 : 0.6;
    const completeness = this.checkCompleteness(swimlaneData);

    const suggestions: AISuggestion[] = [];

    if (laneCount > 5) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        message: 'Consider reducing the number of lanes for better readability',
        confidence: 0.8,
        action: {
          type: 'optimize' as any,
          payload: { type: 'lanes' },
          description: 'Optimize lane structure'
        }
      });
    }

    if (!hasPhases && nodeCount > 8) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        message: 'Consider adding phases to organize the process flow',
        confidence: 0.7,
        action: {
          type: 'create' as any,
          payload: { type: 'phases' },
          description: 'Add process phases'
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
    const swimlaneData = data as SwimlaneData;

    // Optimize node positioning within lanes
    const optimizedNodes = swimlaneData.nodes.map(node => ({
      ...node,
      position: this.optimizeNodePosition(node, swimlaneData)
    }));

    return {
      ...swimlaneData,
      nodes: optimizedNodes
    };
  }

  async suggest(data: DiagramData): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    const swimlaneData = data as SwimlaneData;

    // Check for missing start/end nodes
    const hasStart = swimlaneData.nodes.some(n => n.type === 'start');
    const hasEnd = swimlaneData.nodes.some(n => n.type === 'end');

    if (!hasStart) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        message: 'Consider adding a start node to clearly indicate process beginning',
        confidence: 0.6,
        action: {
          type: 'create' as any,
          payload: { type: 'start-node' },
          description: 'Add start node'
        }
      });
    }

    if (!hasEnd) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        message: 'Consider adding an end node to clearly indicate process completion',
        confidence: 0.6,
        action: {
          type: 'create' as any,
          payload: { type: 'end-node' },
          description: 'Add end node'
        }
      });
    }

    return suggestions;
  }

  async validate(data: DiagramData): Promise<ValidationResult> {
    const validator = new SwimlaneDiagramValidator();
    return validator.validate(data, 'swimlane');
  }

  private checkCompleteness(data: SwimlaneData): number {
    let score = 0.5; // Base score

    if (data.lanes.length > 0) score += 0.2;
    if (data.nodes.length > 0) score += 0.2;
    if (data.edges.length > 0) score += 0.1;

    // Check for start and end nodes
    const hasStart = data.nodes.some(n => n.type === 'start');
    const hasEnd = data.nodes.some(n => n.type === 'end');
    if (hasStart && hasEnd) score += 0.1;

    return Math.min(score, 1.0);
  }

  private optimizeNodePosition(node: any, data: SwimlaneData): Position {
    // Simple positioning optimization
    const laneNodes = data.nodes.filter(n => n.laneId === node.laneId);
    const nodeIndex = laneNodes.indexOf(node);

    return {
      x: nodeIndex * 150 + 50,
      y: 50
    };
  }
}

// Export the complete Swimlane diagram plugin
export const SwimlaneDiagramPlugin: DiagramPlugin = {
  id: 'swimlane-diagram',
  name: 'Swimlane Diagram',
  version: '1.0.0',
  type: 'swimlane',
  description: 'Process flow visualization with role-based lanes and phases',
  author: 'Mermaid Diagram Generator',
  renderer: new SwimlaneDiagramRenderer(),
  aiEnhancer: new SwimlaneDiagramAIEnhancer(),
  validator: new SwimlaneDiagramValidator(),
  config: {
    theme: 'default',
    responsive: true,
    interactive: true
  },
  supportedFormats: ['svg', 'png', 'pdf']
};
