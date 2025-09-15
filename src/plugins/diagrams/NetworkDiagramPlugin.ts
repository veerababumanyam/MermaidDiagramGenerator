/**
 * Network Diagram Plugin
 * Entity relationship visualization with nodes and connections
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
  Position,
  Size
} from '../../types/diagrams';

interface NetworkNode {
  id: string;
  label: string;
  type: 'server' | 'client' | 'router' | 'switch' | 'database' | 'user' | 'custom';
  position: Position;
  size: Size;
  style: any;
  data: Record<string, any>;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'wired' | 'wireless' | 'logical' | 'physical';
  label?: string;
  style: any;
  data: Record<string, any>;
}

interface NetworkData extends DiagramData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  layout: 'force' | 'hierarchical' | 'circular' | 'grid';
}

export class NetworkDiagramRenderer implements DiagramRenderer {
  private svgNS = 'http://www.w3.org/2000/svg';

  async render(data: DiagramData, config: RenderConfig): Promise<RenderResult> {
    const networkData = data as NetworkData;
    const element = document.createElement('div');
    element.className = 'network-diagram-container';

    const svg = this.createSVGElement('svg', {
      width: config.width || 1200,
      height: config.height || 800,
      viewBox: '0 0 1200 800',
      class: 'network-diagram'
    });

    // Calculate node positions using force-directed layout if needed
    const positionedData = await this.calculatePositions(networkData, config);

    // Render edges first (behind nodes)
    positionedData.edges.forEach(edge => {
      const edgeElement = this.createNetworkEdge(edge, positionedData.nodes, config);
      if (edgeElement) svg.appendChild(edgeElement);
    });

    // Render nodes
    positionedData.nodes.forEach(node => {
      const nodeElement = this.createNetworkNode(node, config);
      svg.appendChild(nodeElement);
    });

    element.appendChild(svg);

    const bounds = this.getBounds(positionedData, config);

    return {
      element,
      svg: svg.outerHTML,
      bounds,
      metadata: {
        renderTime: Date.now(),
        nodeCount: positionedData.nodes.length,
        edgeCount: positionedData.edges.length,
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

  private async calculatePositions(data: NetworkData, config: RenderConfig): Promise<NetworkData> {
    // If positions are already set, use them
    if (data.nodes.every(node => node.position.x !== 0 || node.position.y !== 0)) {
      return data;
    }

    // Apply layout algorithm
    switch (data.layout) {
      case 'force':
        return this.applyForceLayout(data, config);
      case 'hierarchical':
        return this.applyHierarchicalLayout(data, config);
      case 'circular':
        return this.applyCircularLayout(data, config);
      case 'grid':
        return this.applyGridLayout(data, config);
      default:
        return this.applyForceLayout(data, config);
    }
  }

  private applyForceLayout(data: NetworkData, config: RenderConfig): NetworkData {
    const centerX = (config.width || 1200) / 2;
    const centerY = (config.height || 800) / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    // Simple circular layout for force-directed simulation
    const positionedNodes = data.nodes.map((node, index) => {
      const angle = (index / data.nodes.length) * 2 * Math.PI;
      return {
        ...node,
        position: {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        }
      };
    });

    return {
      ...data,
      nodes: positionedNodes
    };
  }

  private applyHierarchicalLayout(data: NetworkData, config: RenderConfig): NetworkData {
    // Simple hierarchical layout (could be enhanced with proper tree algorithms)
    const levels = this.calculateNodeLevels(data);
    const levelHeight = (config.height || 800) / (Math.max(...Object.values(levels)) + 1);

    const positionedNodes = data.nodes.map(node => {
      const level = levels[node.id] || 0;
      const nodesInLevel = data.nodes.filter(n => levels[n.id] === level);
      const indexInLevel = nodesInLevel.indexOf(node);
      const levelWidth = (config.width || 1200) / nodesInLevel.length;

      return {
        ...node,
        position: {
          x: (indexInLevel + 0.5) * levelWidth,
          y: (level + 0.5) * levelHeight
        }
      };
    });

    return {
      ...data,
      nodes: positionedNodes
    };
  }

  private applyCircularLayout(data: NetworkData, config: RenderConfig): NetworkData {
    const centerX = (config.width || 1200) / 2;
    const centerY = (config.height || 800) / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    const positionedNodes = data.nodes.map((node, index) => {
      const angle = (index / data.nodes.length) * 2 * Math.PI;
      return {
        ...node,
        position: {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        }
      };
    });

    return {
      ...data,
      nodes: positionedNodes
    };
  }

  private applyGridLayout(data: NetworkData, config: RenderConfig): NetworkData {
    const cols = Math.ceil(Math.sqrt(data.nodes.length));
    const rows = Math.ceil(data.nodes.length / cols);
    const cellWidth = (config.width || 1200) / cols;
    const cellHeight = (config.height || 800) / rows;

    const positionedNodes = data.nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      return {
        ...node,
        position: {
          x: (col + 0.5) * cellWidth,
          y: (row + 0.5) * cellHeight
        }
      };
    });

    return {
      ...data,
      nodes: positionedNodes
    };
  }

  private calculateNodeLevels(data: NetworkData): Record<string, number> {
    const levels: Record<string, number> = {};
    const visited = new Set<string>();

    const calculateLevel = (nodeId: string, level: number = 0): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      levels[nodeId] = Math.max(levels[nodeId] || 0, level);

      // Find children (nodes that this node connects to)
      const children = data.edges
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target);

      children.forEach(childId => {
        calculateLevel(childId, level + 1);
      });
    };

    // Start from nodes with no incoming connections
    const rootNodes = data.nodes.filter(node =>
      !data.edges.some(edge => edge.target === node.id)
    );

    rootNodes.forEach(node => calculateLevel(node.id, 0));

    return levels;
  }

  private createNetworkNode(node: NetworkNode, config: RenderConfig): SVGElement {
    const group = this.createSVGElement('g', { class: 'network-node' });

    // Node shape based on type
    let shape: SVGElement;
    const nodeSize = node.size.width || 40;

    switch (node.type) {
      case 'server':
        shape = this.createSVGElement('rect', {
          x: (node.position.x - nodeSize / 2).toString(),
          y: (node.position.y - nodeSize / 2).toString(),
          width: nodeSize.toString(),
          height: nodeSize.toString(),
          fill: '#4CAF50',
          stroke: '#2E7D32',
          'stroke-width': '2',
          rx: '5'
        });
        break;

      case 'database':
        shape = this.createSVGElement('ellipse', {
          cx: node.position.x.toString(),
          cy: node.position.y.toString(),
          rx: (nodeSize / 2).toString(),
          ry: (nodeSize / 1.5).toString(),
          fill: '#FF9800',
          stroke: '#E65100',
          'stroke-width': '2'
        });
        break;

      case 'router':
      case 'switch':
        shape = this.createSVGElement('polygon', {
          points: `${node.position.x},${node.position.y - nodeSize/2} ${node.position.x + nodeSize/2},${node.position.y + nodeSize/4} ${node.position.x},${node.position.y + nodeSize/2} ${node.position.x - nodeSize/2},${node.position.y + nodeSize/4}`,
          fill: '#2196F3',
          stroke: '#0D47A1',
          'stroke-width': '2'
        });
        break;

      case 'user':
        shape = this.createSVGElement('circle', {
          cx: node.position.x.toString(),
          cy: node.position.y.toString(),
          r: (nodeSize / 2).toString(),
          fill: '#9C27B0',
          stroke: '#4A148C',
          'stroke-width': '2'
        });
        break;

      default:
        shape = this.createSVGElement('circle', {
          cx: node.position.x.toString(),
          cy: node.position.y.toString(),
          r: (nodeSize / 2).toString(),
          fill: '#607D8B',
          stroke: '#37474F',
          'stroke-width': '2'
        });
    }

    // Node label
    const label = this.createSVGElement('text', {
      x: node.position.x.toString(),
      y: (node.position.y + nodeSize / 2 + 20).toString(),
      'text-anchor': 'middle',
      fill: '#212529',
      'font-size': '12',
      'font-weight': 'bold',
      class: 'network-node-label'
    });
    label.textContent = node.label;

    group.appendChild(shape);
    group.appendChild(label);

    // Add interactivity
    shape.addEventListener('mouseover', () => {
      shape.style.strokeWidth = '3';
    });

    shape.addEventListener('mouseout', () => {
      shape.style.strokeWidth = '2';
    });

    return group;
  }

  private createNetworkEdge(edge: NetworkEdge, nodes: NetworkNode[], config: RenderConfig): SVGElement | null {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return null;

    const group = this.createSVGElement('g', { class: 'network-edge' });

    // Edge line
    let pathElement: SVGElement;

    switch (edge.type) {
      case 'wireless':
        // Curved line for wireless connections
        const midX = (sourceNode.position.x + targetNode.position.x) / 2;
        const midY = (sourceNode.position.y + targetNode.position.y) / 2;
        const distance = Math.sqrt(
          Math.pow(targetNode.position.x - sourceNode.position.x, 2) +
          Math.pow(targetNode.position.y - sourceNode.position.y, 2)
        );
        const curvature = Math.min(distance * 0.3, 100);

        pathElement = this.createSVGElement('path', {
          d: `M ${sourceNode.position.x} ${sourceNode.position.y} Q ${midX} ${midY - curvature} ${targetNode.position.x} ${targetNode.position.y}`,
          stroke: '#6c757d',
          'stroke-width': '2',
          fill: 'none',
          'stroke-dasharray': '5,5',
          class: 'wireless-connection'
        });
        break;

      default: // wired or logical
        pathElement = this.createSVGElement('line', {
          x1: sourceNode.position.x.toString(),
          y1: sourceNode.position.y.toString(),
          x2: targetNode.position.x.toString(),
          y2: targetNode.position.y.toString(),
          stroke: '#6c757d',
          'stroke-width': edge.type === 'physical' ? '4' : '2',
          class: edge.type === 'physical' ? 'physical-connection' : 'logical-connection'
        });
    }

    group.appendChild(pathElement);

    // Edge label (if provided)
    if (edge.label) {
      const midX = (sourceNode.position.x + targetNode.position.x) / 2;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2;

      const labelBg = this.createSVGElement('rect', {
        x: (midX - 30).toString(),
        y: (midY - 10).toString(),
        width: '60',
        height: '20',
        fill: 'white',
        stroke: '#dee2e6',
        'stroke-width': '1',
        rx: '3'
      });

      const label = this.createSVGElement('text', {
        x: midX.toString(),
        y: (midY + 4).toString(),
        'text-anchor': 'middle',
        fill: '#495057',
        'font-size': '11',
        class: 'network-edge-label'
      });
      label.textContent = edge.label;

      group.appendChild(labelBg);
      group.appendChild(label);
    }

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

export class NetworkDiagramValidator implements DiagramValidator {
  validate(data: DiagramData, type: string): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    const networkData = data as NetworkData;

    // Validate nodes
    if (!networkData.nodes || networkData.nodes.length === 0) {
      errors.push({
        message: 'Network diagram must have at least one node',
        severity: 'error'
      });
    } else {
      networkData.nodes.forEach((node, index) => {
        if (!node.id) {
          errors.push({
            message: `Node at index ${index} must have an ID`,
            severity: 'error'
          });
        }

        if (!node.label) {
          errors.push({
            message: `Node "${node.id || `at index ${index}`}" must have a label`,
            severity: 'error'
          });
        }
      });
    }

    // Validate edges
    networkData.edges?.forEach((edge, index) => {
      if (!edge.source || !edge.target) {
        errors.push({
          message: `Edge at index ${index} must have source and target nodes`,
          severity: 'error'
        });
      } else {
        const sourceExists = networkData.nodes?.some(node => node.id === edge.source);
        const targetExists = networkData.nodes?.some(node => node.id === edge.target);

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
      }
    });

    // Check for isolated nodes
    const connectedNodes = new Set<string>();
    networkData.edges?.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const isolatedNodes = networkData.nodes?.filter(node => !connectedNodes.has(node.id)) || [];
    if (isolatedNodes.length > 0) {
      warnings.push({
        message: `${isolatedNodes.length} node(s) are not connected to any other nodes`,
        severity: 'warning'
      });
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
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              type: {
                type: 'string',
                enum: ['server', 'client', 'router', 'switch', 'database', 'user', 'custom']
              },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' }
                }
              },
              size: {
                type: 'object',
                properties: {
                  width: { type: 'number' },
                  height: { type: 'number' }
                }
              }
            },
            required: ['id', 'label', 'type']
          }
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              source: { type: 'string' },
              target: { type: 'string' },
              type: { type: 'string', enum: ['wired', 'wireless', 'logical', 'physical'] },
              label: { type: 'string' }
            },
            required: ['source', 'target']
          }
        },
        layout: {
          type: 'string',
          enum: ['force', 'hierarchical', 'circular', 'grid'],
          default: 'force'
        }
      },
      required: ['nodes']
    };
  }
}

export class NetworkDiagramAIEnhancer implements AIEnhancer {
  async analyze(data: DiagramData): Promise<AIAnalysis> {
    const networkData = data as NetworkData;
    const nodeCount = networkData.nodes.length;
    const edgeCount = networkData.edges.length;
    const connectivity = edgeCount / Math.max(1, nodeCount);

    let complexity = 0.3; // Base complexity
    if (nodeCount > 30) complexity += 0.3;
    if (connectivity > 2) complexity += 0.2;
    if (networkData.nodes.some(n => n.type === 'custom')) complexity += 0.1;

    const readability = nodeCount <= 20 && connectivity <= 3 ? 0.9 : 0.6;
    const completeness = this.checkCompleteness(networkData);

    const suggestions: AISuggestion[] = [];

    if (connectivity < 0.5) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        message: 'Network has low connectivity. Consider adding more connections between nodes',
        confidence: 0.7,
        action: {
          type: 'create' as any,
          payload: { type: 'connections' },
          description: 'Add more connections'
        }
      });
    }

    if (nodeCount > 40) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        message: 'Large networks can be overwhelming. Consider using hierarchical layout or breaking into subnets',
        confidence: 0.8,
        action: {
          type: 'optimize' as any,
          payload: { layout: 'hierarchical' },
          description: 'Switch to hierarchical layout'
        }
      });
    }

    // Check for node type diversity
    const nodeTypes = new Set(networkData.nodes.map(n => n.type));
    if (nodeTypes.size === 1 && nodeCount > 5) {
      suggestions.push({
        type: 'content',
        priority: 'low',
        message: 'Consider using different node types to better represent your network components',
        confidence: 0.5,
        action: {
          type: 'update' as any,
          payload: { type: 'node-types' },
          description: 'Diversify node types'
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
    const networkData = data as NetworkData;

    // Optimize layout based on network structure
    const optimizedLayout = this.optimizeLayout(networkData);

    // Optimize node positioning to reduce edge crossings
    const optimizedNodes = this.optimizeNodePositions(networkData);

    return {
      ...networkData,
      layout: optimizedLayout,
      nodes: optimizedNodes
    };
  }

  async suggest(data: DiagramData): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    const networkData = data as NetworkData;

    // Suggest adding labels to edges
    const unlabeledEdges = networkData.edges.filter(edge => !edge.label);
    if (unlabeledEdges.length > networkData.edges.length * 0.5) {
      suggestions.push({
        type: 'content',
        priority: 'low',
        message: 'Consider adding labels to connections to clarify their purpose or type',
        confidence: 0.5,
        action: {
          type: 'update' as any,
          payload: { type: 'edge-labels' },
          description: 'Add edge labels'
        }
      });
    }

    // Suggest grouping related nodes
    const clusters = this.identifyClusters(networkData);
    if (clusters.length > 1) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        message: `Detected ${clusters.length} potential clusters. Consider grouping related nodes together`,
        confidence: 0.6,
        action: {
          type: 'optimize' as any,
          payload: { type: 'clustering' },
          description: 'Group related nodes'
        }
      });
    }

    return suggestions;
  }

  async validate(data: DiagramData): Promise<ValidationResult> {
    const validator = new NetworkDiagramValidator();
    return validator.validate(data, 'network');
  }

  private checkCompleteness(data: NetworkData): number {
    let score = 0.5; // Base score

    if (data.nodes.length > 0) score += 0.2;
    if (data.edges.length > 0) score += 0.2;
    if (data.layout) score += 0.1;

    // Check connectivity
    const connectivity = this.calculateConnectivity(data);
    score += connectivity * 0.1;

    return Math.min(score, 1.0);
  }

  private calculateConnectivity(data: NetworkData): number {
    if (data.nodes.length === 0) return 0;

    const connectedNodes = new Set<string>();
    data.edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    return connectedNodes.size / data.nodes.length;
  }

  private optimizeLayout(data: NetworkData): 'force' | 'hierarchical' | 'circular' | 'grid' {
    const nodeCount = data.nodes.length;
    const connectivity = this.calculateConnectivity(data);

    if (connectivity > 1.5) return 'force'; // High connectivity -> force layout
    if (this.hasHierarchy(data)) return 'hierarchical'; // Hierarchical structure
    if (nodeCount > 50) return 'grid'; // Large networks -> grid

    return 'circular'; // Default for medium-sized networks
  }

  private hasHierarchy(data: NetworkData): boolean {
    // Simple heuristic: check if there are clearly defined levels
    const levels = this.calculateNodeLevels(data);
    const levelCount = new Set(Object.values(levels)).size;

    return levelCount > 2 && levelCount < nodeCount * 0.8;
  }

  private calculateNodeLevels(data: NetworkData): Record<string, number> {
    const levels: Record<string, number> = {};
    const visited = new Set<string>();

    const calculateLevel = (nodeId: string, level: number = 0): number => {
      if (visited.has(nodeId)) return levels[nodeId];
      visited.add(nodeId);

      levels[nodeId] = level;

      // Find children
      const children = data.edges
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target);

      if (children.length > 0) {
        const childLevels = children.map(child => calculateLevel(child, level + 1));
        return Math.max(...childLevels);
      }

      return level;
    };

    // Start from root nodes (nodes with no incoming connections)
    const rootNodes = data.nodes.filter(node =>
      !data.edges.some(edge => edge.target === node.id)
    );

    rootNodes.forEach(node => calculateLevel(node.id, 0));

    return levels;
  }

  private optimizeNodePositions(data: NetworkData): NetworkNode[] {
    // Simple position optimization to reduce edge crossings
    // In a real implementation, this would use more sophisticated algorithms
    return data.nodes.map(node => ({
      ...node,
      position: node.position // Keep existing positions for now
    }));
  }

  private identifyClusters(data: NetworkData): any[] {
    // Simple cluster identification using connected components
    const clusters: any[] = [];
    const visited = new Set<string>();

    const findCluster = (nodeId: string): string[] => {
      const cluster: string[] = [];
      const queue = [nodeId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        cluster.push(current);

        // Find connected nodes
        const connected = data.edges
          .filter(edge => edge.source === current || edge.target === current)
          .map(edge => edge.source === current ? edge.target : edge.source)
          .filter(id => !visited.has(id));

        queue.push(...connected);
      }

      return cluster;
    };

    data.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = findCluster(node.id);
        if (cluster.length > 1) {
          clusters.push(cluster);
        }
      }
    });

    return clusters;
  }
}

// Export the complete Network diagram plugin
export const NetworkDiagramPlugin: DiagramPlugin = {
  id: 'network-diagram',
  name: 'Network Diagram',
  version: '1.0.0',
  type: 'network',
  description: 'Entity relationship visualization with nodes and connections',
  author: 'Mermaid Diagram Generator',
  renderer: new NetworkDiagramRenderer(),
  aiEnhancer: new NetworkDiagramAIEnhancer(),
  validator: new NetworkDiagramValidator(),
  config: {
    theme: 'default',
    responsive: true,
    interactive: true
  },
  supportedFormats: ['svg', 'png', 'pdf']
};
