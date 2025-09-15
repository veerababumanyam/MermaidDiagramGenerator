/**
 * Advanced Diagram Types and Plugin System
 * Extends Mermaid.js with specialized diagram renderers
 */

export interface DiagramPlugin {
  id: string;
  name: string;
  version: string;
  type: DiagramType;
  description: string;
  author: string;
  renderer: DiagramRenderer;
  aiEnhancer?: AIEnhancer;
  validator: DiagramValidator;
  config: DiagramConfig;
  dependencies?: string[];
  supportedFormats: ExportFormat[];
}

export interface DiagramRenderer {
  render(data: DiagramData, config: RenderConfig): Promise<RenderResult>;
  update(element: HTMLElement, data: DiagramData, config: RenderConfig): Promise<void>;
  destroy(element: HTMLElement): void;
  getBounds(data: DiagramData, config: RenderConfig): Bounds;
}

export interface AIEnhancer {
  analyze(data: DiagramData): Promise<AIAnalysis>;
  optimize(data: DiagramData): Promise<DiagramData>;
  suggest(data: DiagramData): Promise<AISuggestion[]>;
  validate(data: DiagramData): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: Location;
}

export interface ValidationWarning extends ValidationError {
  suggestion?: string;
}

export interface Location {
  elementId?: string;
  line?: number;
  column?: number;
}

export interface DiagramValidator {
  validate(data: DiagramData, type: DiagramType): ValidationResult;
  getSchema(type: DiagramType): ValidationSchema;
}

export interface DiagramConfig {
  theme?: string;
  responsive?: boolean;
  interactive?: boolean;
  animation?: boolean;
  zoom?: ZoomConfig;
  layout?: LayoutConfig;
  styling?: StyleConfig;
}

export interface RenderConfig extends DiagramConfig {
  width?: number;
  height?: number;
  scale?: number;
  background?: string;
  padding?: number;
  format?: ExportFormat;
}

export interface RenderResult {
  element: HTMLElement;
  svg?: string;
  bounds: Bounds;
  metadata: RenderMetadata;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderMetadata {
  renderTime: number;
  nodeCount: number;
  edgeCount: number;
  warnings: string[];
  errors: string[];
}

export interface DiagramData {
  type: DiagramType;
  version: string;
  metadata: DiagramMetadata;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  config: DiagramConfig;
  customData?: Record<string, any>;
}

export interface DiagramMetadata {
  title?: string;
  description?: string;
  author?: string;
  createdAt?: Date;
  tags?: string[];
  category?: string;
}

export interface DiagramNode {
  id: string;
  type: NodeType;
  label: string;
  position: Position;
  size: Size;
  style: NodeStyle;
  data: Record<string, any>;
  children?: DiagramNode[];
  parent?: string;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  style: EdgeStyle;
  data: Record<string, any>;
  waypoints?: Position[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface NodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  shape?: NodeShape;
  icon?: string;
  image?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  borderRadius?: number;
}

export interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
  markerStart?: string;
  markerEnd?: string;
  fontSize?: number;
  fontColor?: string;
  labelBackground?: string;
}

export type DiagramType =
  | 'venn'
  | 'swimlane'
  | 'mindmap'
  | 'timeline'
  | 'network'
  | 'sankey'
  | 'kanban'
  | 'journey'
  | 'orgchart'
  | 'gantt'
  | 'custom';

export type NodeType =
  | 'default'
  | 'circle'
  | 'square'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'person'
  | 'database'
  | 'server'
  | 'cloud'
  | 'container'
  | 'process'
  | 'decision'
  | 'start'
  | 'end'
  | 'custom';

export type EdgeType =
  | 'default'
  | 'straight'
  | 'curved'
  | 'orthogonal'
  | 'bezier'
  | 'step'
  | 'smooth';

export type NodeShape =
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'person'
  | 'database'
  | 'custom';

export type ExportFormat = 'svg' | 'png' | 'pdf' | 'json' | 'html';

export interface ZoomConfig {
  enabled: boolean;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  fitToView: boolean;
}

export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  direction: LayoutDirection;
  spacing: SpacingConfig;
  alignment: AlignmentType;
}

export interface StyleConfig {
  theme: string;
  colors: ColorPalette;
  fonts: FontConfig;
  spacing: SpacingConfig;
}

export type LayoutAlgorithm =
  | 'hierarchical'
  | 'force'
  | 'circular'
  | 'tree'
  | 'grid'
  | 'custom';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

export type AlignmentType = 'center' | 'left' | 'right' | 'justify';

export interface SpacingConfig {
  nodeSpacing: number;
  levelSpacing: number;
  edgeSpacing: number;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: string;
  color: string;
}

export interface AIAnalysis {
  complexity: number;
  readability: number;
  completeness: number;
  suggestions: AISuggestion[];
  optimizations: string[];
}

export interface AISuggestion {
  type: 'structure' | 'style' | 'content' | 'layout';
  priority: 'low' | 'medium' | 'high';
  message: string;
  action?: string;
  data?: any;
}

export interface ValidationSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

// Venn Diagram Specific Types
export interface VennData extends DiagramData {
  sets: VennSet[];
  intersections: VennIntersection[];
}

export interface VennSet {
  id: string;
  label: string;
  size: number;
  color: string;
  position: Position;
  radius: number;
}

export interface VennIntersection {
  sets: string[];
  size: number;
  label?: string;
}

// Swimlane Diagram Types
export interface SwimlaneData extends DiagramData {
  lanes: Swimlane[];
  phases: SwimlanePhase[];
}

export interface Swimlane {
  id: string;
  label: string;
  type: 'pool' | 'lane';
  position: Position;
  size: Size;
  style: NodeStyle;
}

export interface SwimlanePhase {
  id: string;
  label: string;
  laneId: string;
  startPosition: number;
  endPosition: number;
}

// Mind Map Types
export interface MindMapData extends DiagramData {
  rootNode: string;
  layout: MindMapLayout;
}

export interface MindMapLayout {
  algorithm: 'tree' | 'force' | 'circular';
  direction: 'center' | 'radial';
  spacing: number;
  depthLimit?: number;
}

// Timeline Types
export interface TimelineData extends DiagramData {
  events: TimelineEvent[];
  axis: TimelineAxis;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  duration?: number;
  category: string;
  position: Position;
}

export interface TimelineAxis {
  type: 'linear' | 'logarithmic';
  startDate: Date;
  endDate: Date;
  intervals: TimelineInterval[];
}

export interface TimelineInterval {
  label: string;
  startDate: Date;
  endDate: Date;
  style: EdgeStyle;
}
