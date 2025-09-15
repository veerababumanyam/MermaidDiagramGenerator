/**
 * Mind Map Diagram Plugin
 * Hierarchical idea visualization with central root and branching connections
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
  MindMapData,
  Position,
  Size
} from '../../types/diagrams';

export class MindMapDiagramRenderer implements DiagramRenderer {
  private svgNS = 'http://www.w3.org/2000/svg';

  async render(data: DiagramData, config: RenderConfig): Promise<RenderResult> {
    const mindMapData = data as MindMapData;
    const element = document.createElement('div');
    element.className = 'mindmap-diagram-container';

    const svg = this.createSVGElement('svg', {
      width: config.width || 1200,
      height: config.height || 800,
      viewBox: '0 0 1200 800',
      class: 'mindmap-diagram'
    });

    // Calculate positions for all nodes
    const positions = this.calculateNodePositions(mindMapData, config);

    // Create connections first (behind nodes)
    mindMapData.edges.forEach(edge => {
      const connection = this.createConnection(edge, positions, config);
      if (connection) svg.appendChild(connection);
    });

    // Create nodes
    Object.entries(positions).forEach(([nodeId, position]) => {
      const node = mindMapData.nodes.find(n => n.id === nodeId);
      if (node) {
        const nodeElement = this.createNode(node, position, config);
        svg.appendChild(nodeElement);
      }
    });

    element.appendChild(svg);

    const bounds = this.getBounds(mindMapData, config);

    return {
      element,
      svg: svg.outerHTML,
      bounds,
      metadata: {
        renderTime: Date.now(),
        nodeCount: mindMapData.nodes.length,
        edgeCount: mindMapData.edges.length,
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

  private calculateNodePositions(data: MindMapData, config: RenderConfig): Record<string, Position> {
    const positions: Record<string, Position> = {};
    const centerX = (config.width || 1200) / 2;
    const centerY = (config.height || 800) / 2;

    // Root node at center
    positions[data.rootNode] = { x: centerX, y: centerY };

    // Calculate positions for child nodes recursively
    this.calculateChildPositions(data, data.rootNode, positions, centerX, centerY, 0, 2 * Math.PI, 200);

    return positions;
  }

  private calculateChildPositions(
    data: MindMapData,
    parentId: string,
    positions: Record<string, Position>,
    centerX: number,
    centerY: number,
    level: number,
    angle: number,
    radius: number
  ): void {
    const children = data.nodes.filter(node => node.parent === parentId);
    if (children.length === 0) return;

    const angleStep = (Math.PI * 2) / children.length;
    let currentAngle = angle - (angleStep * (children.length - 1)) / 2;

    children.forEach(child => {
      const childX = centerX + Math.cos(currentAngle) * radius;
      const childY = centerY + Math.sin(currentAngle) * radius;

      positions[child.id] = { x: childX, y: childY };

      // Recursively position grandchildren
      this.calculateChildPositions(
        data,
        child.id,
        positions,
        childX,
        childY,
        level + 1,
        currentAngle,
        radius * 0.8
      );

      currentAngle += angleStep;
    });
  }

  private createNode(node: any, position: Position, config: RenderConfig): SVGElement {
    const isRoot = !node.parent;
    const nodeRadius = isRoot ? 60 : 40;

    // Node circle
    const circle = this.createSVGElement('circle', {
      cx: position.x.toString(),
      cy: position.y.toString(),
      r: nodeRadius.toString(),
      fill: this.getNodeColor(node, isRoot),
      stroke: this.darkenColor(this.getNodeColor(node, isRoot), 0.3),
      'stroke-width': '3',
      class: `mindmap-node ${isRoot ? 'root-node' : 'child-node'}`
    });

    // Node text
    const text = this.createSVGElement('text', {
      x: position.x.toString(),
      y: position.y.toString(),
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: '#ffffff',
      'font-size': isRoot ? '16' : '14',
      'font-weight': 'bold',
      'pointer-events': 'none',
      class: 'mindmap-node-text'
    });

    // Handle text wrapping for long labels
    const words = node.label.split(' ');
    if (words.length > 1 && !isRoot) {
      // Multi-line text for child nodes
      const lineHeight = 16;
      words.forEach((word, index) => {
        const tspan = this.createSVGElement('tspan', {
          x: position.x.toString(),
          y: (position.y - (words.length - 1) * lineHeight / 2 + index * lineHeight).toString(),
          'text-anchor': 'middle'
        });
        tspan.textContent = word;
        text.appendChild(tspan);
      });
    } else {
      text.textContent = node.label;
    }

    const group = this.createSVGElement('g', { class: 'mindmap-node-group' });
    group.appendChild(circle);
    group.appendChild(text);

    // Add interactivity
    group.addEventListener('mouseover', () => {
      circle.style.strokeWidth = '4';
    });

    group.addEventListener('mouseout', () => {
      circle.style.strokeWidth = '3';
    });

    return group;
  }

  private createConnection(edge: any, positions: Record<string, Position>, config: RenderConfig): SVGElement | null {
    const sourcePos = positions[edge.source];
    const targetPos = positions[edge.target];

    if (!sourcePos || !targetPos) return null;

    // Calculate control points for curved connection
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point offset based on distance
    const offset = Math.min(distance * 0.3, 100);
    const cp1x = sourcePos.x + dx * 0.5 - dy * (offset / distance);
    const cp1y = sourcePos.y + dy * 0.5 + dx * (offset / distance);
    const cp2x = targetPos.x - dx * 0.5 - dy * (offset / distance);
    const cp2y = targetPos.y - dy * 0.5 + dx * (offset / distance);

    const path = this.createSVGElement('path', {
      d: `M ${sourcePos.x} ${sourcePos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetPos.x} ${targetPos.y}`,
      stroke: '#6c757d',
      'stroke-width': '3',
      fill: 'none',
      class: 'mindmap-connection'
    });

    return path;
  }

  private getNodeColor(node: any, isRoot: boolean): string {
    if (isRoot) return '#4CAF50'; // Green for root

    // Color based on depth or category
    const colors = [
      '#2196F3', // Blue
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
      '#FFC107', // Amber
      '#F44336', // Red
      '#607D8B'  // Blue Grey
    ];

    // Simple color assignment based on node ID hash
    const hash = node.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  private darkenColor(color: string, factor: number): string {
    // Simple color darkening
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  private createSVGElement(tagName: string, attributes: Record<string, string | number> = {}): SVGElement {
    const element = document.createElementNS(this.svgNS, tagName) as SVGElement;

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value.toString());
    });

    return element;
  }
}

export class MindMapDiagramValidator implements DiagramValidator {
  validate(data: DiagramData, type: string): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    const mindMapData = data as MindMapData;

    // Validate root node exists
    if (!mindMapData.rootNode) {
      errors.push({
        message: 'Mind map must have a root node',
        severity: 'error'
      });
    } else {
      const rootExists = mindMapData.nodes.some(node => node.id === mindMapData.rootNode);
      if (!rootExists) {
        errors.push({
          message: `Root node "${mindMapData.rootNode}" does not exist in nodes`,
          severity: 'error'
        });
      }
    }

    // Validate parent-child relationships
    mindMapData.nodes.forEach(node => {
      if (node.parent && !mindMapData.nodes.some(n => n.id === node.parent)) {
        errors.push({
          message: `Node "${node.id}" references non-existent parent "${node.parent}"`,
          severity: 'error'
        });
      }
    });

    // Check for circular references
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const children = mindMapData.nodes.filter(n => n.parent === nodeId);
      for (const child of children) {
        if (hasCycle(child.id)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    if (mindMapData.rootNode && hasCycle(mindMapData.rootNode)) {
      errors.push({
        message: 'Circular reference detected in mind map structure',
        severity: 'error'
      });
    }

    // Validate depth limit
    if (mindMapData.layout?.depthLimit) {
      const maxDepth = this.calculateMaxDepth(mindMapData);
      if (maxDepth > mindMapData.layout.depthLimit) {
        warnings.push({
          message: `Mind map depth (${maxDepth}) exceeds recommended limit (${mindMapData.layout.depthLimit})`,
          severity: 'warning'
        });
      }
    }

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
        rootNode: { type: 'string' },
        layout: {
          type: 'object',
          properties: {
            algorithm: { type: 'string', enum: ['tree', 'force', 'circular'] },
            direction: { type: 'string', enum: ['center', 'radial'] },
            spacing: { type: 'number' },
            depthLimit: { type: 'number' }
          }
        }
      },
      required: ['rootNode']
    };
  }

  private calculateMaxDepth(data: MindMapData): number {
    const calculateDepth = (nodeId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const children = data.nodes.filter(n => n.parent === nodeId);
      if (children.length === 0) return 0;

      return 1 + Math.max(...children.map(child => calculateDepth(child.id, new Set(visited))));
    };

    return calculateDepth(data.rootNode);
  }
}

export class MindMapDiagramAIEnhancer implements AIEnhancer {
  async analyze(data: DiagramData): Promise<AIAnalysis> {
    const mindMapData = data as MindMapData;
    const nodeCount = mindMapData.nodes.length;
    const maxDepth = this.calculateMaxDepth(mindMapData);

    let complexity = 0.3; // Base complexity
    if (nodeCount > 20) complexity += 0.3;
    if (maxDepth > 4) complexity += 0.2;
    if (nodeCount > 50) complexity += 0.2;

    const readability = nodeCount <= 30 && maxDepth <= 4 ? 0.9 : 0.6;
    const completeness = this.checkCompleteness(mindMapData);

    const suggestions: AISuggestion[] = [];

    if (maxDepth > 5) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        message: 'Consider restructuring - mind maps work best with 3-4 levels of depth',
        confidence: 0.9,
        action: {
          type: 'optimize' as any,
          payload: { type: 'depth' },
          description: 'Reduce depth levels'
        }
      });
    }

    if (nodeCount > 40) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        message: 'Large mind maps can be overwhelming. Consider breaking into sub-maps',
        confidence: 0.8,
        action: {
          type: 'optimize' as any,
          payload: { type: 'split' },
          description: 'Split into sub-maps'
        }
      });
    }

    // Check for unbalanced branches
    const branchBalance = this.analyzeBranchBalance(mindMapData);
    if (branchBalance < 0.5) {
      suggestions.push({
        type: 'structure',
        priority: 'low',
        message: 'Some branches are much larger than others. Consider balancing the structure',
        confidence: 0.6,
        action: {
          type: 'optimize' as any,
          payload: { type: 'balance' },
          description: 'Balance branches'
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
    const mindMapData = data as MindMapData;

    // Optimize layout algorithm based on structure
    const optimizedLayout = this.optimizeLayout(mindMapData);

    return {
      ...mindMapData,
      layout: optimizedLayout
    };
  }

  async suggest(data: DiagramData): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    const mindMapData = data as MindMapData;

    // Suggest better root node if current one is too long
    const rootNode = mindMapData.nodes.find(n => n.id === mindMapData.rootNode);
    if (rootNode && rootNode.label.length > 30) {
      suggestions.push({
        type: 'content',
        priority: 'low',
        message: 'Consider shortening the root node label for better readability',
        confidence: 0.5,
        action: {
          type: 'update' as any,
          payload: { nodeId: rootNode.id, property: 'label' },
          description: 'Shorten root label'
        }
      });
    }

    // Suggest adding more connections between branches
    const connectivity = this.calculateConnectivity(mindMapData);
    if (connectivity < 0.3) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        message: 'Consider adding cross-connections between different branches',
        confidence: 0.7,
        action: {
          type: 'create' as any,
          payload: { type: 'cross-links' },
          description: 'Add cross-branch connections'
        }
      });
    }

    return suggestions;
  }

  async validate(data: DiagramData): Promise<ValidationResult> {
    const validator = new MindMapDiagramValidator();
    return validator.validate(data, 'mindmap');
  }

  private calculateMaxDepth(data: MindMapData): number {
    const validator = new MindMapDiagramValidator();
    return (validator as any).calculateMaxDepth(data);
  }

  private checkCompleteness(data: MindMapData): number {
    let score = 0.5; // Base score

    if (data.rootNode) score += 0.2;
    if (data.nodes.length > 1) score += 0.2;
    if (data.layout) score += 0.1;

    // Check for balanced structure
    const branchBalance = this.analyzeBranchBalance(data);
    score += branchBalance * 0.1;

    return Math.min(score, 1.0);
  }

  private analyzeBranchBalance(data: MindMapData): number {
    const rootChildren = data.nodes.filter(n => n.parent === data.rootNode);
    if (rootChildren.length <= 1) return 1.0;

    const childCounts = rootChildren.map(child => {
      return this.countDescendants(data, child.id);
    });

    const avg = childCounts.reduce((a, b) => a + b, 0) / childCounts.length;
    const variance = childCounts.reduce((acc, count) => acc + Math.pow(count - avg, 2), 0) / childCounts.length;
    const stdDev = Math.sqrt(variance);

    // Return balance score (1.0 = perfectly balanced, 0 = highly unbalanced)
    return Math.max(0, 1 - (stdDev / avg));
  }

  private countDescendants(data: MindMapData, nodeId: string): number {
    const children = data.nodes.filter(n => n.parent === nodeId);
    return children.length + children.reduce((acc, child) => acc + this.countDescendants(data, child.id), 0);
  }

  private calculateConnectivity(data: MindMapData): number {
    // Simple connectivity measure based on cross-branch links
    const totalPossibleLinks = (data.nodes.length * (data.nodes.length - 1)) / 2;
    const actualLinks = data.edges.length;

    return actualLinks / totalPossibleLinks;
  }

  private optimizeLayout(data: MindMapData): any {
    const nodeCount = data.nodes.length;
    const maxDepth = this.calculateMaxDepth(data);

    // Choose optimal layout algorithm
    let algorithm = 'tree';
    if (nodeCount > 30) algorithm = 'force';
    if (maxDepth > 4) algorithm = 'circular';

    return {
      algorithm,
      direction: 'radial',
      spacing: Math.max(100, 200 - nodeCount * 2),
      depthLimit: Math.min(maxDepth + 1, 6)
    };
  }
}

// Export the complete Mind Map diagram plugin
export const MindMapDiagramPlugin: DiagramPlugin = {
  id: 'mindmap-diagram',
  name: 'Mind Map Diagram',
  version: '1.0.0',
  type: 'mindmap',
  description: 'Hierarchical idea visualization with central root and branching connections',
  author: 'Mermaid Diagram Generator',
  renderer: new MindMapDiagramRenderer(),
  aiEnhancer: new MindMapDiagramAIEnhancer(),
  validator: new MindMapDiagramValidator(),
  config: {
    theme: 'default',
    responsive: true,
    interactive: true
  },
  supportedFormats: ['svg', 'png', 'pdf']
};
