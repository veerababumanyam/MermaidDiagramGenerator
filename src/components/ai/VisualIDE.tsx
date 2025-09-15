/**
 * Enhanced Visual IDE Component
 * Comprehensive drag-and-drop diagram construction interface with advanced features
 *
 * Features:
 * - Advanced canvas with multi-selection, grouping, and snapping
 * - Rich component palette with search and filtering
 * - Real-time collaboration support
 * - Undo/redo system
 * - Visual feedback and validation
 * - Accessibility support
 * - Performance optimizations
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { diagramPluginManager } from '../../../src/plugins/diagrams/PluginManager';
import { webComponentsEngine, templateComponentBuilder } from '../../../src/utils/templates/WebComponentsEngine';
import type {
  VisualElement,
  VisualConnection,
  VisualCanvas,
  VisualComponent,
  Position,
  Size,
  DragState,
  DiagramType
} from '../../../src/types/ai';
import {
  IconZoomIn, IconZoomOut, IconResetZoom, IconTrash, IconCopy,
  IconUndo, IconRedo, IconGroup, IconUngroup, IconAlignLeft,
  IconAlignCenter, IconAlignRight, IconSearch, IconFilter
} from '../../../components/Icons';

interface VisualIDEProps {
  diagramType: DiagramType;
  onDiagramChange: (data: any) => void;
  initialData?: any;
  onClose?: () => void;
}

// Enhanced state management with history
interface VisualIDEState {
  canvas: VisualCanvas;
  history: VisualCanvas[];
  historyIndex: number;
  selectedElements: string[];
  selectedConnections: string[];
  groups: VisualGroup[];
  clipboard: VisualElement[];
  isMultiSelectMode: boolean;
  snapEnabled: boolean;
  gridVisible: boolean;
}

// Visual group for element grouping
interface VisualGroup {
  id: string;
  name: string;
  elementIds: string[];
  bounds: { x: number; y: number; width: number; height: number };
  color: string;
}

const VisualIDE: React.FC<VisualIDEProps> = ({
  diagramType,
  onDiagramChange,
  initialData,
  onClose
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);

  // Enhanced state with history management
  const [state, setState] = useState<VisualIDEState>({
    canvas: {
      id: 'visual-canvas',
      elements: [],
      connections: [],
      background: { type: 'grid', color: '#ffffff', opacity: 0.1 },
      grid: { enabled: true, size: 20, color: '#e0e0e0', opacity: 0.5 },
      snap: { enabled: true, threshold: 10, targets: ['grid'] }
    },
    history: [],
    historyIndex: -1,
    selectedElements: [],
    selectedConnections: [],
    groups: [],
    clipboard: [],
    isMultiSelectMode: false,
    snapEnabled: true,
    gridVisible: true
  });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: Position; end: Position } | null>(null);

  // Component palette state
  const [availableComponents, setAvailableComponents] = useState<VisualComponent[]>([]);
  const [componentSearch, setComponentSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // UI state
  const [showProperties, setShowProperties] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // History management functions
  const saveToHistory = useCallback((newCanvas: VisualCanvas) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ ...newCanvas });
      return {
        ...prev,
        canvas: newCanvas,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          canvas: prev.history[newIndex],
          historyIndex: newIndex
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          canvas: prev.history[newIndex],
          historyIndex: newIndex
        };
      }
      return prev;
    });
  }, []);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // Clipboard operations
  const copySelected = useCallback(() => {
    const selectedElements = state.canvas.elements.filter(el =>
      state.selectedElements.includes(el.id)
    );
    setState(prev => ({ ...prev, clipboard: selectedElements }));
  }, [state.canvas.elements, state.selectedElements]);

  const pasteElements = useCallback(() => {
    if (state.clipboard.length === 0) return;

    const offset = { x: 20, y: 20 };
    const newElements = state.clipboard.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: el.position.x + offset.x,
        y: el.position.y + offset.y
      }
    }));

    const newCanvas = {
      ...state.canvas,
      elements: [...state.canvas.elements, ...newElements]
    };

    saveToHistory(newCanvas);
    setState(prev => ({
      ...prev,
      selectedElements: newElements.map(el => el.id)
    }));
  }, [state.clipboard, state.canvas, saveToHistory]);

  // Grouping operations
  const groupSelected = useCallback(() => {
    if (state.selectedElements.length < 2) return;

    const selectedElements = state.canvas.elements.filter(el =>
      state.selectedElements.includes(el.id)
    );

    const bounds = calculateBounds(selectedElements);
    const groupId = `group-${Date.now()}`;

    const newGroup: VisualGroup = {
      id: groupId,
      name: `Group ${state.groups.length + 1}`,
      elementIds: state.selectedElements,
      bounds,
      color: getRandomColor()
    };

    setState(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup]
    }));
  }, [state.selectedElements, state.canvas.elements, state.groups.length]);

  const ungroupSelected = useCallback(() => {
    const selectedGroups = state.groups.filter(group =>
      state.selectedElements.some(elId => group.elementIds.includes(elId))
    );

    setState(prev => ({
      ...prev,
      groups: prev.groups.filter(group => !selectedGroups.includes(group))
    }));
  }, [state.groups, state.selectedElements]);

  // Initialize canvas with existing data
  useEffect(() => {
    if (initialData) {
      // Convert diagram data to visual elements
      const visualElements = convertDiagramToVisualElements(initialData);
      const newCanvas = {
        ...state.canvas,
        elements: visualElements.elements,
        connections: visualElements.connections
      };
      saveToHistory(newCanvas);
    } else {
      // Initialize with empty canvas for new diagrams
      saveToHistory(state.canvas);
    }

    // Load available components for this diagram type
    loadComponentsForDiagramType(diagramType);
  }, [diagramType, initialData]);

  // Convert diagram data to visual elements
  const convertDiagramToVisualElements = useCallback((diagramData: any) => {
    const elements: VisualElement[] = [];
    const connections: VisualConnection[] = [];

    // Convert nodes to visual elements
    if (diagramData.nodes) {
      diagramData.nodes.forEach((node: any, index: number) => {
        elements.push({
          id: node.id,
          type: 'shape',
          position: node.position || { x: 100 + index * 150, y: 100 + index * 100 },
          size: node.size || { width: 120, height: 60 },
          rotation: 0,
          style: {
            fill: getRandomColor(),
            stroke: '#333333',
            strokeWidth: 2,
            opacity: 1
          },
          data: node,
          children: []
        });
      });
    }

    // Convert edges to connections
    if (diagramData.edges) {
      diagramData.edges.forEach((edge: any) => {
        connections.push({
          id: edge.id || `connection-${Date.now()}`,
          source: edge.source,
          target: edge.target,
          type: 'straight',
          waypoints: [],
          style: {
            stroke: '#666666',
            strokeWidth: 2,
            opacity: 1
          },
          data: edge
        });
      });
    }

    return { elements, connections };
  }, []);

  // Load components available for the current diagram type
  const loadComponentsForDiagramType = useCallback(async (type: DiagramType) => {
    const components: VisualComponent[] = [];

    // Basic shapes available for all diagram types
    components.push(
      {
        id: 'shape-rectangle',
        name: 'Rectangle',
        category: 'shapes',
        icon: '□',
        template: {
          id: '',
          type: 'shape',
          position: { x: 0, y: 0 },
          size: { width: 120, height: 60 },
          rotation: 0,
          style: { fill: '#e3f2fd', stroke: '#1976d2', strokeWidth: 2, opacity: 1 },
          data: { shapeType: 'rectangle' },
          children: []
        },
        properties: [
          { name: 'width', type: 'number', defaultValue: 120, required: true },
          { name: 'height', type: 'number', defaultValue: 60, required: true },
          { name: 'fill', type: 'color', defaultValue: '#e3f2fd', required: false }
        ],
        events: ['click', 'dblclick']
      },
      {
        id: 'shape-circle',
        name: 'Circle',
        category: 'shapes',
        icon: '○',
        template: {
          id: '',
          type: 'shape',
          position: { x: 0, y: 0 },
          size: { width: 80, height: 80 },
          rotation: 0,
          style: { fill: '#f3e5f5', stroke: '#7b1fa2', strokeWidth: 2, opacity: 1 },
          data: { shapeType: 'circle' },
          children: []
        },
        properties: [
          { name: 'radius', type: 'number', defaultValue: 40, required: true },
          { name: 'fill', type: 'color', defaultValue: '#f3e5f5', required: false }
        ],
        events: ['click', 'dblclick']
      }
    );

    // Add diagram-type-specific components
    switch (type) {
      case 'venn':
        components.push({
          id: 'venn-set',
          name: 'Venn Set',
          category: 'venn',
          icon: '⊙',
          template: {
            id: '',
            type: 'shape',
            position: { x: 0, y: 0 },
            size: { width: 150, height: 150 },
            rotation: 0,
            style: { fill: '#e8f5e8', stroke: '#2e7d32', strokeWidth: 3, opacity: 0.7 },
            data: { type: 'venn-set', radius: 75 },
            children: []
          },
          properties: [
            { name: 'radius', type: 'number', defaultValue: 75, required: true },
            { name: 'fill', type: 'color', defaultValue: '#e8f5e8', required: false }
          ],
          events: ['click', 'dblclick']
        });
        break;

      case 'swimlane':
        components.push(
          {
            id: 'swimlane-lane',
            name: 'Swimlane',
            category: 'swimlane',
            icon: '▬',
            template: {
              id: '',
              type: 'container',
              position: { x: 0, y: 0 },
              size: { width: 400, height: 100 },
              rotation: 0,
              style: { fill: '#f5f5f5', stroke: '#bdbdbd', strokeWidth: 1, opacity: 1 },
              data: { type: 'lane', label: 'New Lane' },
              children: []
            },
            properties: [
              { name: 'label', type: 'string', defaultValue: 'New Lane', required: true },
              { name: 'width', type: 'number', defaultValue: 400, required: true },
              { name: 'height', type: 'number', defaultValue: 100, required: true }
            ],
            events: ['click', 'dblclick']
          },
          {
            id: 'swimlane-process',
            name: 'Process',
            category: 'swimlane',
            icon: '▭',
            template: {
              id: '',
              type: 'shape',
              position: { x: 0, y: 0 },
              size: { width: 120, height: 60 },
              rotation: 0,
              style: { fill: '#fff3e0', stroke: '#ef6c00', strokeWidth: 2, opacity: 1 },
              data: { type: 'process', label: 'Process' },
              children: []
            },
            properties: [
              { name: 'label', type: 'string', defaultValue: 'Process', required: true }
            ],
            events: ['click', 'dblclick']
          }
        );
        break;

      case 'mindmap':
        components.push({
          id: 'mindmap-node',
          name: 'Mind Map Node',
          category: 'mindmap',
          icon: '◎',
          template: {
            id: '',
            type: 'shape',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 50 },
            rotation: 0,
            style: { fill: '#e3f2fd', stroke: '#1976d2', strokeWidth: 2, opacity: 1 },
            data: { type: 'mindmap-node', label: 'Idea' },
            children: []
          },
          properties: [
            { name: 'label', type: 'string', defaultValue: 'Idea', required: true },
            { name: 'fill', type: 'color', defaultValue: '#e3f2fd', required: false }
          ],
          events: ['click', 'dblclick']
        });
        break;
    }

    setAvailableComponents(components);
  }, [diagramType]);

  // Handle canvas drop
  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const componentId = event.dataTransfer.getData('component-id');
    const component = availableComponents.find(c => c.id === componentId);

    if (!component || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    let finalX = x;
    let finalY = y;

    // Snap to grid if enabled
    if (state.snapEnabled && state.canvas.grid.enabled) {
      finalX = snapToGrid({ x, y: 0 }, state.canvas.grid.size).x;
      finalY = snapToGrid({ x: 0, y }, state.canvas.grid.size).y;
    }

    const newElement: VisualElement = {
      ...component.template,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: { x: finalX, y: finalY }
    };

    const newCanvas = {
      ...state.canvas,
      elements: [...state.canvas.elements, newElement]
    };

    saveToHistory(newCanvas);
    setState(prev => ({
      ...prev,
      canvas: newCanvas,
      selectedElements: [newElement.id]
    }));

    // Notify parent of change
    updateDiagramData();
  }, [availableComponents, pan, zoom, state.snapEnabled, state.canvas, saveToHistory, updateDiagramData]);

  // Handle element drag
  const handleElementDrag = useCallback((elementId: string, newPosition: Position) => {
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        elements: prev.canvas.elements.map(el =>
          el.id === elementId
            ? { ...el, position: newPosition }
            : el
        )
      }
    }));

    updateDiagramData();
  }, [updateDiagramData]);

  // Handle connection creation
  const handleConnectionStart = useCallback((elementId: string) => {
    setIsConnecting(true);
    setConnectionStart(elementId);
  }, []);

  const handleConnectionEnd = useCallback((elementId: string) => {
    if (isConnecting && connectionStart && connectionStart !== elementId) {
      const newConnection: VisualConnection = {
        id: `connection-${Date.now()}`,
        source: connectionStart,
        target: elementId,
        type: 'straight',
        waypoints: [],
        style: {
          stroke: '#666666',
          strokeWidth: 2,
          opacity: 1
        },
        data: {}
      };

      const newCanvas = {
        ...state.canvas,
        connections: [...state.canvas.connections, newConnection]
      };

      saveToHistory(newCanvas);
      setState(prev => ({
        ...prev,
        canvas: newCanvas
      }));

      updateDiagramData();
    }

    setIsConnecting(false);
    setConnectionStart(null);
  }, [isConnecting, connectionStart, state.canvas, saveToHistory, updateDiagramData]);

  // Convert visual elements back to diagram data
  const updateDiagramData = useCallback(() => {
    const diagramData = convertVisualElementsToDiagram(state.canvas.elements, state.canvas.connections, diagramType);
    onDiagramChange(diagramData);
  }, [state.canvas.elements, state.canvas.connections, diagramType, onDiagramChange]);

  const convertVisualElementsToDiagram = useCallback((elements: VisualElement[], connections: VisualConnection[], type: DiagramType) => {
    // Convert based on diagram type
    switch (type) {
      case 'venn':
        return {
          type: 'venn',
          sets: elements.map(el => ({
            id: el.id,
            label: el.data.label || 'Set',
            size: el.data.size || 100,
            color: el.style.fill || '#e8f5e8',
            position: el.position,
            radius: el.data.radius || 50
          })),
          intersections: [] // Would be calculated based on overlapping sets
        };

      case 'swimlane':
        return {
          type: 'swimlane',
          lanes: elements.filter(el => el.data.type === 'lane').map(el => ({
            id: el.id,
            label: el.data.label,
            type: 'lane'
          })),
          phases: [], // Would be extracted from phase elements
          nodes: elements.filter(el => el.data.type !== 'lane').map(el => ({
            id: el.id,
            label: el.data.label,
            type: el.data.type,
            laneId: findContainingLane(el, elements),
            position: el.position
          })),
          edges: connections.map(conn => ({
            id: conn.id,
            source: conn.source,
            target: conn.target
          }))
        };

      default:
        return {
          type,
          nodes: elements.map(el => ({
            id: el.id,
            label: el.data.label || 'Node',
            position: el.position,
            size: el.size,
            ...el.data
          })),
          edges: connections.map(conn => ({
            id: conn.id,
            source: conn.source,
            target: conn.target,
            ...conn.data
          }))
        };
    }
  }, []);

  const findContainingLane = (element: VisualElement, allElements: VisualElement[]): string => {
    // Find which lane contains this element
    const lanes = allElements.filter(el => el.data.type === 'lane');
    for (const lane of lanes) {
      if (element.position.x >= lane.position.x &&
          element.position.x <= lane.position.x + lane.size.width &&
          element.position.y >= lane.position.y &&
          element.position.y <= lane.position.y + lane.size.height) {
        return lane.id;
      }
    }
    return '';
  };

  // Utility functions
  const getRandomColor = (): string => {
    const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec', '#f1f8e9', '#e8eaf6', '#fce4ec'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const calculateBounds = (elements: VisualElement[]): { x: number; y: number; width: number; height: number } => {
    if (elements.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(el => {
      minX = Math.min(minX, el.position.x);
      minY = Math.min(minY, el.position.y);
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const snapToGrid = (position: Position, gridSize: number): Position => {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  };

  const getCanvasBounds = (): { x: number; y: number; width: number; height: number } => {
    return calculateBounds(state.canvas.elements);
  };

  // Filtered components based on search and category
  const filteredComponents = useMemo(() => {
    return availableComponents.filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(componentSearch.toLowerCase()) ||
                           component.category.toLowerCase().includes(componentSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availableComponents, componentSearch, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(availableComponents.map(c => c.category))];
    return cats;
  }, [availableComponents]);

  return (
    <div className={`visual-ide-container flex h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Enhanced Component Palette */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Palette Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Component Palette</h3>

          {/* Search */}
          <div className="relative mb-3">
            <IconSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search components..."
              value={componentSearch}
              onChange={(e) => setComponentSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Components List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredComponents.map(component => (
              <div
                key={component.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('component-id', component.id);
                }}
                className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 hover:shadow-sm transition-all"
                title={component.name}
              >
                <span className="text-2xl mr-3 flex-shrink-0">{component.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{component.name}</div>
                  <div className="text-xs text-gray-500 truncate">{component.category}</div>
                </div>
              </div>
            ))}
          </div>

          {filteredComponents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <IconFilter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No components found</p>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Toolbar */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between flex-wrap gap-2">
          {/* Left Section - History & Clipboard */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <IconUndo />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <IconRedo />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button
              onClick={copySelected}
              disabled={state.selectedElements.length === 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy (Ctrl+C)"
            >
              <IconCopy />
            </button>
            <button
              onClick={pasteElements}
              disabled={state.clipboard.length === 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Paste (Ctrl+V)"
            >
              <IconCopy />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button
              onClick={groupSelected}
              disabled={state.selectedElements.length < 2}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Group Selected Elements"
            >
              <IconGroup />
            </button>
            <button
              onClick={ungroupSelected}
              disabled={state.selectedElements.length === 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ungroup Selected Elements"
            >
              <IconUngroup />
            </button>
          </div>

          {/* Center Section - Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.1, 3))}
              className="p-2 hover:bg-gray-100 rounded"
              title="Zoom In"
            >
              <IconZoomIn />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))}
              className="p-2 hover:bg-gray-100 rounded"
              title="Zoom Out"
            >
              <IconZoomOut />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-2 hover:bg-gray-100 rounded"
              title="Reset Zoom & Pan"
            >
              <IconResetZoom />
            </button>
          </div>

          {/* Right Section - Canvas Options & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setState(prev => ({ ...prev, gridVisible: !prev.gridVisible }))}
              className={`p-2 rounded transition-colors ${
                state.gridVisible ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title={state.gridVisible ? 'Hide Grid' : 'Show Grid'}
            >
              □
            </button>

            <button
              onClick={() => setState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled }))}
              className={`p-2 rounded transition-colors ${
                state.snapEnabled ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title={state.snapEnabled ? 'Disable Snap' : 'Enable Snap'}
            >
              ⊹
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {state.selectedElements.length > 0 && (
              <button
                onClick={() => {
                  const newCanvas = {
                    ...state.canvas,
                    elements: state.canvas.elements.filter(el => !state.selectedElements.includes(el.id)),
                    connections: state.canvas.connections.filter(conn =>
                      !state.selectedElements.includes(conn.source) &&
                      !state.selectedElements.includes(conn.target)
                    )
                  };
                  saveToHistory(newCanvas);
                  setState(prev => ({ ...prev, selectedElements: [] }));
                }}
                className="p-2 hover:bg-gray-100 rounded text-red-600"
                title="Delete Selected (Delete)"
              >
                <IconTrash />
              </button>
            )}

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button
              onClick={() => setShowProperties(!showProperties)}
              className={`p-2 rounded transition-colors ${
                showProperties ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Toggle Properties Panel"
            >
              ⚙️
            </button>

            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={`p-2 rounded transition-colors ${
                showMinimap ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Toggle Minimap"
            >
              🗺️
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-100 rounded"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded text-gray-600"
                title="Close Visual IDE"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-white"
          style={{
            cursor: isConnecting ? 'crosshair' : dragState.isDragging ? 'grabbing' : 'grab',
            backgroundImage: state.gridVisible && state.canvas.grid.enabled
              ? `radial-gradient(circle, ${state.canvas.grid.color} 1px, transparent 1px)`
              : 'none',
            backgroundSize: state.gridVisible && state.canvas.grid.enabled ? `${state.canvas.grid.size}px ${state.canvas.grid.size}px` : 'auto'
          }}
          onDrop={handleCanvasDrop}
          onDragOver={(e) => e.preventDefault()}

          // Multi-selection support
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              // Start selection box
              const rect = canvasRef.current!.getBoundingClientRect();
              const startX = (e.clientX - rect.left - pan.x) / zoom;
              const startY = (e.clientY - rect.top - pan.y) / zoom;

              setSelectionBox({ start: { x: startX, y: startY }, end: { x: startX, y: startY } });
              setIsSelecting(true);
            }
          }}

          onMouseMove={(e) => {
            if (isSelecting && selectionBox) {
              const rect = canvasRef.current!.getBoundingClientRect();
              const endX = (e.clientX - rect.left - pan.x) / zoom;
              const endY = (e.clientY - rect.top - pan.y) / zoom;

              setSelectionBox(prev => prev ? { ...prev, end: { x: endX, y: endY } } : null);
            }
          }}

          onMouseUp={() => {
            if (isSelecting && selectionBox) {
              // Calculate selection bounds
              const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
              const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
              const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
              const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);

              // Find elements within selection
              const selectedIds = state.canvas.elements
                .filter(el =>
                  el.position.x < maxX &&
                  el.position.x + el.size.width > minX &&
                  el.position.y < maxY &&
                  el.position.y + el.size.height > minY
                )
                .map(el => el.id);

              setState(prev => ({ ...prev, selectedElements: selectedIds }));
              setIsSelecting(false);
              setSelectionBox(null);
            }
          }}

          // Keyboard shortcuts
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) {
              switch (e.key) {
                case 'z':
                  e.preventDefault();
                  if (e.shiftKey) {
                    redo();
                  } else {
                    undo();
                  }
                  break;
                case 'y':
                  e.preventDefault();
                  redo();
                  break;
                case 'c':
                  e.preventDefault();
                  copySelected();
                  break;
                case 'v':
                  e.preventDefault();
                  pasteElements();
                  break;
                case 'a':
                  e.preventDefault();
                  setState(prev => ({
                    ...prev,
                    selectedElements: prev.canvas.elements.map(el => el.id)
                  }));
                  break;
              }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
              if (state.selectedElements.length > 0) {
                const newCanvas = {
                  ...state.canvas,
                  elements: state.canvas.elements.filter(el => !state.selectedElements.includes(el.id)),
                  connections: state.canvas.connections.filter(conn =>
                    !state.selectedElements.includes(conn.source) &&
                    !state.selectedElements.includes(conn.target)
                  )
                };
                saveToHistory(newCanvas);
                setState(prev => ({ ...prev, selectedElements: [] }));
              }
            } else if (e.key === 'Escape') {
              setState(prev => ({ ...prev, selectedElements: [] }));
            }
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Selection Box */}
            {isSelecting && selectionBox && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
                style={{
                  left: Math.min(selectionBox.start.x, selectionBox.end.x),
                  top: Math.min(selectionBox.start.y, selectionBox.end.y),
                  width: Math.abs(selectionBox.end.x - selectionBox.start.x),
                  height: Math.abs(selectionBox.end.y - selectionBox.start.y)
                }}
              />
            )}

            {/* Render Groups */}
            {state.groups.map(group => {
              const elements = state.canvas.elements.filter(el => group.elementIds.includes(el.id));
              if (elements.length === 0) return null;

              return (
                <div
                  key={group.id}
                  className="absolute border-2 border-dashed rounded pointer-events-none"
                  style={{
                    left: group.bounds.x - 5,
                    top: group.bounds.y - 5,
                    width: group.bounds.width + 10,
                    height: group.bounds.height + 10,
                    borderColor: group.color,
                    backgroundColor: `${group.color}20`
                  }}
                >
                  <div
                    className="absolute -top-6 left-0 text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: group.color, color: 'white' }}
                  >
                    {group.name}
                  </div>
                </div>
              );
            })}
            {/* Render connections */}
            {state.canvas.connections.map(connection => (
              <svg
                key={connection.id}
                className="absolute pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <line
                  x1={canvas.elements.find(el => el.id === connection.source)?.position.x || 0}
                  y1={canvas.elements.find(el => el.id === connection.source)?.position.y || 0}
                  x2={canvas.elements.find(el => el.id === connection.target)?.position.x || 0}
                  y2={canvas.elements.find(el => el.id === connection.target)?.position.y || 0}
                  stroke={connection.style.stroke}
                  strokeWidth={connection.style.strokeWidth}
                  opacity={connection.style.opacity}
                />
              </svg>
            ))}

            {/* Render elements */}
            {state.canvas.elements.map(element => {
              const isSelected = state.selectedElements.includes(element.id);
              const isInGroup = state.groups.some(group => group.elementIds.includes(element.id));

              return (
                <div
                  key={element.id}
                  className={`absolute select-none transition-all duration-150 ${
                    isSelected
                      ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg z-10'
                      : isInGroup
                      ? 'ring-1 ring-gray-300'
                      : ''
                  } ${dragState.isDragging && dragState.elementId === element.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    width: element.size.width,
                    height: element.size.height,
                    transform: `rotate(${element.rotation}deg)`,
                    zIndex: isSelected ? 10 : isInGroup ? 5 : 1
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();

                    if (e.shiftKey) {
                      // Start connection
                      setIsConnecting(true);
                      setConnectionStart(element.id);
                    } else {
                      // Start drag
                      const rect = canvasRef.current!.getBoundingClientRect();
                      const startX = e.clientX - rect.left;
                      const startY = e.clientY - rect.top;

                      setDragState({
                        isDragging: true,
                        elementId: element.id,
                        startPosition: { x: startX, y: startY },
                        currentPosition: { x: startX, y: startY },
                        offset: {
                          x: element.position.x - (startX - pan.x) / zoom,
                          y: element.position.y - (startY - pan.y) / zoom
                        }
                      });

                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const rect = canvasRef.current!.getBoundingClientRect();
                        const currentX = moveEvent.clientX - rect.left;
                        const currentY = moveEvent.clientY - rect.top;

                        let newX = (currentX - pan.x) / zoom + dragState.offset.x;
                        let newY = (currentY - pan.y) / zoom + dragState.offset.y;

                        // Snap to grid if enabled
                        if (state.snapEnabled && state.canvas.grid.enabled) {
                          newX = snapToGrid({ x: newX, y: 0 }, state.canvas.grid.size).x;
                          newY = snapToGrid({ x: 0, y: newY }, state.canvas.grid.size).y;
                        }

                        setDragState(prev => ({
                          ...prev,
                          currentPosition: { x: currentX, y: currentY }
                        }));

                        // Update element position immediately for smooth dragging
                        setState(prev => ({
                          ...prev,
                          canvas: {
                            ...prev.canvas,
                            elements: prev.canvas.elements.map(el =>
                              el.id === element.id
                                ? { ...el, position: { x: newX, y: newY } }
                                : el
                            )
                          }
                        }));
                      };

                      const handleMouseUp = () => {
                        if (dragState.isDragging) {
                          // Save to history
                          saveToHistory(state.canvas);
                        }
                        setDragState({ isDragging: false, startPosition: { x: 0, y: 0 }, currentPosition: { x: 0, y: 0 }, offset: { x: 0, y: 0 } });
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (isConnecting) {
                      if (connectionStart && connectionStart !== element.id) {
                        handleConnectionEnd(element.id);
                      }
                      setIsConnecting(false);
                      setConnectionStart(null);
                    } else {
                      // Multi-selection support
                      setState(prev => {
                        const isCurrentlySelected = prev.selectedElements.includes(element.id);
                        let newSelection;

                        if (e.ctrlKey || e.metaKey) {
                          // Toggle selection
                          if (isCurrentlySelected) {
                            newSelection = prev.selectedElements.filter(id => id !== element.id);
                          } else {
                            newSelection = [...prev.selectedElements, element.id];
                          }
                        } else {
                          // Single selection
                          newSelection = [element.id];
                        }

                        return { ...prev, selectedElements: newSelection };
                      });
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    // Could open properties panel or inline editing
                    console.log('Double-clicked element:', element.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Diagram element ${element.data.label || element.type}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setState(prev => ({
                        ...prev,
                        selectedElements: [element.id]
                      }));
                    }
                  }}
                >
                {/* Element content based on type */}
                {element.type === 'shape' && (
                  <div
                    className="w-full h-full border-2 border-gray-400 rounded"
                    style={{
                      backgroundColor: element.style.fill,
                      borderColor: element.style.stroke,
                      borderWidth: element.style.strokeWidth
                    }}
                  >
                    <div className="flex items-center justify-center h-full text-sm font-medium text-gray-700">
                      {element.data.label || element.type}
                    </div>
                  </div>
                )}

                {element.type === 'container' && (
                  <div
                    className="w-full h-full border border-gray-300 bg-gray-50"
                    style={{ backgroundColor: element.style.fill }}
                  >
                    <div className="p-2 text-sm font-medium text-gray-700 border-b border-gray-300">
                      {element.data.label || 'Container'}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Connection preview */}
            {isConnecting && connectionStart && (
              <svg className="absolute pointer-events-none" style={{ width: '100%', height: '100%' }}>
                <line
                  x1={canvas.elements.find(el => el.id === connectionStart)?.position.x || 0}
                  y1={canvas.elements.find(el => el.id === connectionStart)?.position.y || 0}
                  x2={dragState.currentPosition.x}
                  y2={dragState.currentPosition.y}
                  stroke="#007bff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 text-sm text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>{state.canvas.elements.length} elements</span>
            <span>{state.canvas.connections.length} connections</span>
            <span>{state.groups.length} groups</span>
            {state.selectedElements.length > 0 && (
              <span className="text-blue-600 font-medium">
                {state.selectedElements.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <span>Grid: {state.gridVisible ? 'On' : 'Off'}</span>
            <span>Snap: {state.snapEnabled ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div className="absolute bottom-4 right-4 w-48 h-32 bg-white border border-gray-300 rounded shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-2 py-1 text-xs font-medium border-b border-gray-200">
            Minimap
          </div>
          <div className="relative w-full h-full bg-gray-50">
            {/* Simplified canvas representation */}
            <div className="absolute inset-1 bg-white border border-gray-200 rounded">
              {state.canvas.elements.map(element => {
                const canvasBounds = getCanvasBounds();
                if (canvasBounds.width === 0 || canvasBounds.height === 0) return null;

                const relativeX = ((element.position.x - canvasBounds.x) / canvasBounds.width) * 100;
                const relativeY = ((element.position.y - canvasBounds.y) / canvasBounds.height) * 100;
                const relativeWidth = (element.size.width / canvasBounds.width) * 100;
                const relativeHeight = (element.size.height / canvasBounds.height) * 100;

                return (
                  <div
                    key={element.id}
                    className={`absolute border ${state.selectedElements.includes(element.id) ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-gray-200'}`}
                    style={{
                      left: `${Math.max(0, Math.min(100 - relativeWidth, relativeX))}%`,
                      top: `${Math.max(0, Math.min(100 - relativeHeight, relativeY))}%`,
                      width: `${Math.max(2, relativeWidth)}%`,
                      height: `${Math.max(2, relativeHeight)}%`
                    }}
                  />
                );
              })}

              {/* Viewport indicator */}
              <div
                className="absolute border-2 border-red-500 bg-red-100 bg-opacity-30 pointer-events-none"
                style={{
                  left: `${Math.max(0, Math.min(100, -pan.x / zoom / (canvasBounds.width || 800) * 100))}%`,
                  top: `${Math.max(0, Math.min(100, -pan.y / zoom / (canvasBounds.height || 600) * 100))}%`,
                  width: `${Math.min(100, (canvasRef.current?.clientWidth || 800) / zoom / (canvasBounds.width || 800) * 100)}%`,
                  height: `${Math.min(100, (canvasRef.current?.clientHeight || 600) / zoom / (canvasBounds.height || 600) * 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Properties Panel */}
      {showProperties && (
        <div className="absolute top-4 right-4 w-80 bg-white border border-gray-300 rounded shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Properties</h3>
            <button
              onClick={() => setShowProperties(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {state.selectedElements.length === 0 ? (
              <p className="text-gray-500 text-sm">Select an element to view its properties</p>
            ) : state.selectedElements.length === 1 ? (
              <ElementProperties
                element={state.canvas.elements.find(el => el.id === state.selectedElements[0])!}
                onUpdate={(updates) => {
                  setState(prev => ({
                    ...prev,
                    canvas: {
                      ...prev.canvas,
                      elements: prev.canvas.elements.map(el =>
                        el.id === state.selectedElements[0] ? { ...el, ...updates } : el
                      )
                    }
                  }));
                  saveToHistory(state.canvas);
                }}
              />
            ) : (
              <BulkProperties
                elements={state.canvas.elements.filter(el => state.selectedElements.includes(el.id))}
                onUpdate={(updates) => {
                  setState(prev => ({
                    ...prev,
                    canvas: {
                      ...prev.canvas,
                      elements: prev.canvas.elements.map(el =>
                        state.selectedElements.includes(el.id) ? { ...el, ...updates } : el
                      )
                    }
                  }));
                  saveToHistory(state.canvas);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Element Properties Component
interface ElementPropertiesProps {
  element: VisualElement;
  onUpdate: (updates: Partial<VisualElement>) => void;
}

const ElementProperties: React.FC<ElementPropertiesProps> = ({ element, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <span className="text-sm text-gray-500 capitalize">{element.type}</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          value={element.data.label || ''}
          onChange={(e) => onUpdate({
            data: { ...element.data, label: e.target.value }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
          <input
            type="number"
            value={Math.round(element.position.x)}
            onChange={(e) => onUpdate({
              position: { ...element.position, x: parseFloat(e.target.value) || 0 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
          <input
            type="number"
            value={Math.round(element.position.y)}
            onChange={(e) => onUpdate({
              position: { ...element.position, y: parseFloat(e.target.value) || 0 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
          <input
            type="number"
            value={Math.round(element.size.width)}
            onChange={(e) => onUpdate({
              size: { ...element.size, width: parseFloat(e.target.value) || 0 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
          <input
            type="number"
            value={Math.round(element.size.height)}
            onChange={(e) => onUpdate({
              size: { ...element.size, height: parseFloat(e.target.value) || 0 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rotation</label>
        <input
          type="range"
          min="0"
          max="360"
          value={element.rotation}
          onChange={(e) => onUpdate({ rotation: parseFloat(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-500">{element.rotation}°</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fill Color</label>
        <input
          type="color"
          value={element.style.fill}
          onChange={(e) => onUpdate({
            style: { ...element.style, fill: e.target.value }
          })}
          className="w-full h-10 border border-gray-300 rounded cursor-pointer"
        />
      </div>
    </div>
  );
};

// Bulk Properties Component
interface BulkPropertiesProps {
  elements: VisualElement[];
  onUpdate: (updates: Partial<VisualElement>) => void;
}

const BulkProperties: React.FC<BulkPropertiesProps> = ({ elements, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Bulk Edit ({elements.length} elements)</h4>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fill Color</label>
        <input
          type="color"
          onChange={(e) => onUpdate({
            style: { fill: e.target.value, stroke: '#333333', strokeWidth: 2, opacity: 1 }
          })}
          className="w-full h-10 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
          <input
            type="number"
            placeholder="Same for all"
            onChange={(e) => onUpdate({
              size: { width: parseFloat(e.target.value) || 120, height: elements[0]?.size.height || 60 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
          <input
            type="number"
            placeholder="Same for all"
            onChange={(e) => onUpdate({
              size: { width: elements[0]?.size.width || 120, height: parseFloat(e.target.value) || 60 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            // Align elements
            const bounds = elements.reduce(
              (acc, el) => ({
                left: Math.min(acc.left, el.position.x),
                top: Math.min(acc.top, el.position.y),
                right: Math.max(acc.right, el.position.x + el.size.width),
                bottom: Math.max(acc.bottom, el.position.y + el.size.height)
              }),
              { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
            );

            elements.forEach(el => {
              onUpdate({
                position: {
                  x: bounds.left,
                  y: el.position.y
                }
              });
            });
          }}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Align Left
        </button>
      </div>
    </div>
  );
};

export default VisualIDE;
