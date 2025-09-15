/**
 * Enhanced Template System Types
 * Extends the basic diagram template with advanced features
 */

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  authorId?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: TemplateCategory;
  complexity: TemplateComplexity;
  estimatedTime: number; // minutes
  thumbnail?: string;
  previewImage?: string;
  license: TemplateLicense;
  aiGenerated?: boolean;
  aiModel?: string;
  usageCount: number;
  rating: number;
  reviewCount: number;
}

export interface TemplateComponent {
  id: string;
  type: ComponentType;
  name: string;
  description: string;
  props: Record<string, any>;
  children?: TemplateComponent[];
  styles?: Record<string, any>;
  events?: TemplateEvent[];
  validation?: ComponentValidation;
}

export interface TemplateEvent {
  type: string;
  handler: string;
  conditions?: TemplateCondition[];
}

export interface TemplateCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'regex';
  value: any;
}

export interface ComponentValidation {
  required?: boolean;
  type?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customRule?: string;
}

export interface Template {
  metadata: TemplateMetadata;
  components: TemplateComponent[];
  styles: Record<string, any>;
  scripts?: string[];
  dependencies?: string[];
  config: TemplateConfig;
}

export interface TemplateConfig {
  responsive: boolean;
  interactive: boolean;
  aiEnhanced: boolean;
  collaborative: boolean;
  exportFormats: ExportFormat[];
  themes: string[];
  variables: Record<string, any>;
}

export interface TemplateInstance {
  id: string;
  templateId: string;
  name: string;
  data: Record<string, any>;
  styles: Record<string, any>;
  createdAt: Date;
  modifiedAt: Date;
  version: number;
  collaborators: string[];
  permissions: TemplatePermissions;
}

export interface TemplatePermissions {
  owner: string;
  editors: string[];
  viewers: string[];
  public: boolean;
  allowFork: boolean;
  allowExport: boolean;
}

export interface TemplateMarketplace {
  templates: Template[];
  categories: TemplateCategory[];
  filters: TemplateFilters;
  featured: string[];
  trending: string[];
  recentlyUpdated: string[];
}

export interface TemplateFilters {
  category?: TemplateCategory;
  complexity?: TemplateComplexity;
  author?: string;
  tags?: string[];
  rating?: number;
  aiGenerated?: boolean;
  license?: TemplateLicense;
}

export type TemplateCategory =
  | 'business'
  | 'technical'
  | 'education'
  | 'design'
  | 'marketing'
  | 'project-management'
  | 'infrastructure'
  | 'data-flow'
  | 'user-experience'
  | 'custom';

export type TemplateComplexity = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type TemplateLicense = 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'BSD-3-Clause' | 'CC-BY-4.0' | 'Proprietary';

export type ComponentType =
  | 'container'
  | 'text'
  | 'image'
  | 'shape'
  | 'connector'
  | 'icon'
  | 'input'
  | 'button'
  | 'chart'
  | 'table'
  | 'custom';

export type ExportFormat = 'svg' | 'png' | 'pdf' | 'json' | 'html' | 'markdown';

// Web Components Interface
export interface WebComponentDefinition {
  tagName: string;
  className: string;
  template: string;
  styles: string;
  properties: Record<string, any>;
  methods: Record<string, Function>;
  events: string[];
}

// Template Builder Interface
export interface TemplateBuilder {
  createComponent(type: ComponentType, props?: Record<string, any>): TemplateComponent;
  updateComponent(id: string, updates: Partial<TemplateComponent>): TemplateComponent;
  deleteComponent(id: string): void;
  addChild(parentId: string, child: TemplateComponent): void;
  moveComponent(id: string, newParentId: string, index?: number): void;
  cloneComponent(id: string): TemplateComponent;
  validateTemplate(template: Template): ValidationResult;
  generateCode(template: Template): string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  componentId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning extends ValidationError {
  suggestion?: string;
}
