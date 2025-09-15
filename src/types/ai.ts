/**
 * AI Enhancement Types and Interfaces
 * Comprehensive AI-powered features for diagram creation and editing
 */

export interface AIEnhancementState {
  coPilot: AICoPilotState;
  visualIDE: VisualIDEState;
  validator: AIValidatorState;
  optimizer: AIOptimizerState;
  personalization: AIPersonalizationState;
  analytics: AIAnalyticsState;
}

export interface AICoPilotState {
  isActive: boolean;
  conversation: AIConversation;
  suggestions: AISuggestion[];
  context: AIContext;
  preferences: AICoPilotPreferences;
}

export interface VisualIDEState {
  canvas: VisualCanvas;
  components: VisualComponent[];
  connections: VisualConnection[];
  selectedElements: string[];
  dragState: DragState;
  zoom: number;
  pan: Position;
}

export interface AIValidatorState {
  isValidating: boolean;
  results: ValidationResult[];
  autoFixEnabled: boolean;
  lastValidation: Date;
}

export interface AIOptimizerState {
  isOptimizing: boolean;
  suggestions: OptimizationSuggestion[];
  appliedOptimizations: string[];
  performanceMetrics: PerformanceMetrics;
}

export interface AIPersonalizationState {
  userProfile: AIUserProfile;
  preferences: AIPreferences;
  history: AIInteraction[];
  recommendations: AIRecommendation[];
}

export interface AIAnalyticsState {
  usageMetrics: UsageMetrics;
  performanceMetrics: PerformanceMetrics;
  errorMetrics: ErrorMetrics;
  featureAdoption: FeatureAdoptionMetrics;
}

// AI Co-Pilot Interfaces
export interface AICoPilot {
  chat(message: string, context: AIContext): Promise<AIResponse>;
  suggest(context: AIContext): Promise<AISuggestion[]>;
  explain(diagram: DiagramData): Promise<AIExplanation>;
  refactor(diagram: DiagramData, instruction: string): Promise<DiagramData>;
  generateTemplate(requirements: TemplateRequirements): Promise<Template>;
  validate(diagram: DiagramData): Promise<ValidationResult>;
}

export interface AIConversation {
  id: string;
  messages: AIConversationMessage[];
  context: AIContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AIContext {
  diagram?: DiagramData;
  template?: Template;
  userAction?: string;
  selection?: string[];
  viewport?: Viewport;
  history?: AIInteraction[];
}

export interface AIResponse {
  message: string;
  suggestions?: AISuggestion[];
  actions?: AIAction[];
  confidence: number;
  metadata: Record<string, any>;
}

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  confidence: number;
  action: AIAction;
  preview?: any;
}

export interface AIAction {
  type: ActionType;
  payload: any;
  description: string;
}

export interface AIExplanation {
  summary: string;
  details: string[];
  insights: string[];
  recommendations: string[];
}

export interface AICoPilotPreferences {
  autoSuggest: boolean;
  contextAware: boolean;
  proactiveHelp: boolean;
  learningMode: boolean;
  voiceEnabled: boolean;
}

// Visual IDE Interfaces
export interface VisualCanvas {
  id: string;
  elements: VisualElement[];
  connections: VisualConnection[];
  background: CanvasBackground;
  grid: GridConfig;
  snap: SnapConfig;
}

export interface VisualElement {
  id: string;
  type: VisualElementType;
  position: Position;
  size: Size;
  rotation: number;
  style: VisualStyle;
  data: Record<string, any>;
  children?: VisualElement[];
  parent?: string;
}

export interface VisualConnection {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
  waypoints: Position[];
  style: ConnectionStyle;
  data: Record<string, any>;
}

export interface VisualComponent {
  id: string;
  name: string;
  category: string;
  icon: string;
  template: VisualElement;
  properties: ComponentProperty[];
  events: ComponentEvent[];
}

export interface ComponentProperty {
  name: string;
  type: PropertyType;
  defaultValue: any;
  required: boolean;
  options?: any[];
  validation?: PropertyValidation;
}

export interface ComponentEvent {
  name: string;
  description: string;
  payload: Record<string, any>;
}

export interface DragState {
  isDragging: boolean;
  elementId?: string;
  startPosition: Position;
  currentPosition: Position;
  offset: Position;
}

export type VisualElementType =
  | 'shape'
  | 'text'
  | 'image'
  | 'icon'
  | 'connector'
  | 'container'
  | 'chart'
  | 'custom';

export type ConnectionType =
  | 'straight'
  | 'curved'
  | 'orthogonal'
  | 'bezier';

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'select'
  | 'multiselect'
  | 'object'
  | 'array';

// AI Validation and Optimization
export interface AIValidator {
  validate(diagram: DiagramData): Promise<ValidationResult>;
  checkSyntax(code: string): Promise<SyntaxCheckResult>;
  analyzeStructure(diagram: DiagramData): Promise<StructureAnalysis>;
  suggestFixes(issues: ValidationIssue[]): Promise<FixSuggestion[]>;
}

export interface AIOptimizer {
  optimize(diagram: DiagramData): Promise<OptimizationResult>;
  analyzePerformance(diagram: DiagramData): Promise<PerformanceAnalysis>;
  suggestLayout(diagram: DiagramData): Promise<LayoutSuggestion[]>;
  compress(diagram: DiagramData): Promise<CompressedDiagram>;
}

export interface OptimizationSuggestion {
  id: string;
  type: OptimizationType;
  title: string;
  description: string;
  impact: OptimizationImpact;
  action: AIAction;
}

export type OptimizationType =
  | 'layout'
  | 'styling'
  | 'structure'
  | 'performance'
  | 'accessibility';

export type OptimizationImpact = 'low' | 'medium' | 'high';

// AI Personalization
export interface AIUserProfile {
  userId: string;
  preferences: AIPreferences;
  skills: UserSkill[];
  history: AIInteraction[];
  patterns: UsagePattern[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIPreferences {
  theme?: string;
  diagramTypes?: string[];
  complexity?: number;
  autoSave?: boolean;
  notifications?: NotificationSettings;
  shortcuts?: KeyboardShortcut[];
}

export interface AIInteraction {
  id: string;
  type: InteractionType;
  timestamp: Date;
  context: AIContext;
  result: any;
  feedback?: UserFeedback;
}

export interface AIRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  reason: string;
  confidence: number;
  action: AIAction;
}

export type InteractionType =
  | 'diagram_create'
  | 'template_use'
  | 'ai_suggestion'
  | 'validation_run'
  | 'optimization_apply'
  | 'export_action';

export type RecommendationType =
  | 'template'
  | 'feature'
  | 'workflow'
  | 'optimization';

// Analytics and Metrics
export interface UsageMetrics {
  diagramsCreated: number;
  templatesUsed: number;
  aiInteractions: number;
  exportsPerformed: number;
  sessionDuration: number;
  featureUsage: Record<string, number>;
}

export interface PerformanceMetrics {
  averageLoadTime: number;
  averageRenderTime: number;
  averageAIResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorTypes: Record<string, number>;
  userImpact: ErrorImpact[];
  recoveryRate: number;
}

export interface FeatureAdoptionMetrics {
  features: Record<string, FeatureAdoption>;
  userSegments: UserSegmentMetrics[];
}

export interface FeatureAdoption {
  users: number;
  sessions: number;
  adoptionRate: number;
  retentionRate: number;
}

// Supporting Types
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface CanvasBackground {
  type: 'solid' | 'grid' | 'dots' | 'image';
  color: string;
  image?: string;
  opacity: number;
}

export interface GridConfig {
  enabled: boolean;
  size: number;
  color: string;
  opacity: number;
}

export interface SnapConfig {
  enabled: boolean;
  threshold: number;
  targets: SnapTarget[];
}

export type SnapTarget = 'grid' | 'elements' | 'guides';

export interface VisualStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  shadow?: Shadow;
  gradient?: Gradient;
}

export interface ConnectionStyle extends VisualStyle {
  strokeDasharray?: string;
  markerStart?: Marker;
  markerEnd?: Marker;
}

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface Gradient {
  type: 'linear' | 'radial';
  colors: GradientStop[];
  angle?: number;
}

export interface GradientStop {
  color: string;
  position: number;
}

export interface Marker {
  type: 'arrow' | 'circle' | 'square' | 'diamond';
  size: number;
  color: string;
}

export interface UserSkill {
  area: string;
  level: number;
  lastAssessed: Date;
}

export interface UsagePattern {
  pattern: string;
  frequency: number;
  confidence: number;
}

export interface NotificationSettings {
  suggestions: boolean;
  warnings: boolean;
  updates: boolean;
  achievements: boolean;
}

export interface KeyboardShortcut {
  keys: string[];
  action: string;
  description: string;
}

export interface UserFeedback {
  rating: number;
  comment?: string;
  helpful: boolean;
}

export interface PropertyValidation {
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
}

export interface SyntaxCheckResult {
  isValid: boolean;
  errors: SyntaxError[];
  warnings: SyntaxWarning[];
}

export interface StructureAnalysis {
  complexity: number;
  readability: number;
  maintainability: number;
  issues: StructureIssue[];
}

export interface FixSuggestion {
  issueId: string;
  title: string;
  description: string;
  action: AIAction;
  confidence: number;
}

export interface OptimizationResult {
  diagram: DiagramData;
  improvements: string[];
  metrics: OptimizationMetrics;
}

export interface PerformanceAnalysis {
  renderTime: number;
  memoryUsage: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface LayoutSuggestion {
  layout: LayoutAlgorithm;
  reason: string;
  confidence: number;
}

export interface CompressedDiagram {
  data: DiagramData;
  compressionRatio: number;
  originalSize: number;
  compressedSize: number;
}

export interface ValidationIssue {
  id: string;
  type: IssueType;
  severity: Severity;
  message: string;
  location?: Location;
  suggestion?: string;
}

export type IssueType =
  | 'syntax'
  | 'structure'
  | 'styling'
  | 'accessibility'
  | 'performance';

export type Severity = 'error' | 'warning' | 'info';

export interface Location {
  elementId?: string;
  line?: number;
  column?: number;
}

export interface OptimizationMetrics {
  nodeReduction: number;
  edgeSimplification: number;
  styleOptimization: number;
  layoutImprovement: number;
}

export interface ErrorImpact {
  errorId: string;
  affectedUsers: number;
  impactScore: number;
  recoveryActions: string[];
}

export interface UserSegmentMetrics {
  segment: string;
  userCount: number;
  engagementScore: number;
  featureUsage: Record<string, number>;
}

// Basic types used in AI interfaces
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning extends ValidationError {
  suggestion?: string;
}

export type SuggestionType =
  | 'structure'
  | 'style'
  | 'content'
  | 'layout'
  | 'optimization'
  | 'template';

export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'style'
  | 'generate'
  | 'validate'
  | 'optimize';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

// Additional supporting types
export interface SyntaxWarning {
  line: number;
  column: number;
  message: string;
  severity: 'warning' | 'error';
}

export interface StructureIssue {
  type: string;
  elementId?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

// Forward declarations for complex types
export interface DiagramData {
  type: string;
  nodes: any[];
  edges: any[];
  metadata?: any;
}

export interface Template {
  id: string;
  name: string;
  components: any[];
}

export interface TemplateRequirements {
  category: string;
  complexity: string;
  features: string[];
}
