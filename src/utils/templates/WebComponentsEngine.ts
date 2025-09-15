/**
 * Web Components Engine for Template System
 * Provides a framework for creating reusable template components
 */

import type {
  TemplateComponent,
  ComponentType,
  WebComponentDefinition,
  TemplateBuilder,
  ValidationResult,
  ValidationError
} from '../../types/templates';

export class WebComponentsEngine {
  private registeredComponents: Map<string, WebComponentDefinition> = new Map();
  private componentInstances: Map<string, HTMLElement> = new Map();
  private initialized = false;

  /**
   * Register a new web component definition
   */
  registerComponent(definition: WebComponentDefinition): void {
    if (this.registeredComponents.has(definition.tagName)) {
      console.warn(`Component ${definition.tagName} is already registered, skipping`);
      return;
    }

    // Create the custom element class
    const componentClass = this.createComponentClass(definition);

    // Register with the browser
    if (!customElements.get(definition.tagName)) {
      customElements.define(definition.tagName, componentClass);
    }

    this.registeredComponents.set(definition.tagName, definition);
    console.log(`Registered web component: ${definition.tagName}`);
  }

  /**
   * Create a component instance
   */
  createInstance(tagName: string, props: Record<string, any> = {}): HTMLElement {
    const definition = this.registeredComponents.get(tagName);
    if (!definition) {
      throw new Error(`Component ${tagName} not registered`);
    }

    const element = document.createElement(tagName);

    // Set properties
    Object.entries(props).forEach(([key, value]) => {
      if (definition.properties[key]) {
        (element as any)[key] = value;
      } else {
        element.setAttribute(key, value.toString());
      }
    });

    // Generate unique ID for tracking
    const instanceId = `${tagName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    element.setAttribute('data-instance-id', instanceId);
    this.componentInstances.set(instanceId, element);

    return element;
  }

  /**
   * Update a component instance
   */
  updateInstance(instanceId: string, updates: Record<string, any>): void {
    const element = this.componentInstances.get(instanceId);
    if (!element) return;

    const tagName = element.tagName.toLowerCase();
    const definition = this.registeredComponents.get(tagName);
    if (!definition) return;

    Object.entries(updates).forEach(([key, value]) => {
      if (definition.properties[key]) {
        (element as any)[key] = value;
      } else {
        element.setAttribute(key, value.toString());
      }
    });

    // Trigger update lifecycle
    if (typeof (element as any).update === 'function') {
      (element as any).update();
    }
  }

  /**
   * Remove a component instance
   */
  removeInstance(instanceId: string): void {
    const element = this.componentInstances.get(instanceId);
    if (element) {
      element.remove();
      this.componentInstances.delete(instanceId);
    }
  }

  /**
   * Get component definition
   */
  getDefinition(tagName: string): WebComponentDefinition | undefined {
    return this.registeredComponents.get(tagName);
  }

  /**
   * Get all registered components
   */
  getAllDefinitions(): WebComponentDefinition[] {
    return Array.from(this.registeredComponents.values());
  }

  /**
   * Create the custom element class for a component definition
   */
  private createComponentClass(definition: WebComponentDefinition): typeof HTMLElement {
    const ComponentClass = class extends HTMLElement {
      private _properties: Record<string, any> = {};
      private _shadowRoot: ShadowRoot;

      constructor() {
        super();
        this._shadowRoot = this.attachShadow({ mode: 'open' });

        // Initialize properties
        Object.keys(definition.properties).forEach(prop => {
          this._properties[prop] = definition.properties[prop].defaultValue;
        });
      }

      connectedCallback(): void {
        this.render();
        this.setupEventListeners();

        // Call connected lifecycle method if defined
        if (definition.methods.connected) {
          definition.methods.connected.call(this);
        }
      }

      disconnectedCallback(): void {
        this.cleanupEventListeners();

        // Call disconnected lifecycle method if defined
        if (definition.methods.disconnected) {
          definition.methods.disconnected.call(this);
        }
      }

      attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (definition.properties[name]) {
          this._properties[name] = this.parseAttributeValue(newValue, definition.properties[name].type);
          this.render();
        }

        // Call attribute changed lifecycle method if defined
        if (definition.methods.attributeChanged) {
          definition.methods.attributeChanged.call(this, name, oldValue, newValue);
        }
      }

      static get observedAttributes(): string[] {
        return Object.keys(definition.properties).filter(prop =>
          definition.properties[prop].attribute !== false
        );
      }

      private render(): void {
        // Apply styles
        if (definition.styles) {
          const styleElement = document.createElement('style');
          styleElement.textContent = definition.styles;
          this._shadowRoot.innerHTML = '';
          this._shadowRoot.appendChild(styleElement);
        }

        // Render template
        if (definition.template) {
          const templateElement = document.createElement('div');
          templateElement.innerHTML = this.interpolateTemplate(definition.template, this._properties);
          this._shadowRoot.appendChild(templateElement);
        }
      }

      private setupEventListeners(): void {
        if (definition.events) {
          definition.events.forEach(eventType => {
            this.addEventListener(eventType, (event) => {
              // Dispatch custom event to parent
              const customEvent = new CustomEvent(`component-${eventType}`, {
                detail: { originalEvent: event, component: this },
                bubbles: true,
                composed: true
              });
              this.dispatchEvent(customEvent);
            });
          });
        }
      }

      private cleanupEventListeners(): void {
        if (definition.events) {
          definition.events.forEach(eventType => {
            // Event listeners are automatically removed when element is removed
          });
        }
      }

      private parseAttributeValue(value: string, type: string): any {
        switch (type) {
          case 'number':
            return parseFloat(value);
          case 'boolean':
            return value === 'true';
          case 'object':
          case 'array':
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          default:
            return value;
        }
      }

      private interpolateTemplate(template: string, properties: Record<string, any>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, prop) => {
          return properties[prop] !== undefined ? properties[prop] : match;
        });
      }
    };

    // Property getters and setters
    Object.keys(definition.properties).forEach(prop => {
      Object.defineProperty(ComponentClass.prototype, prop, {
        get: function() {
          return this._properties[prop];
        },
        set: function(value: any) {
          this._properties[prop] = value;
          this.render();

          // Call property changed lifecycle method if defined
          if (definition.methods.propertyChanged) {
            definition.methods.propertyChanged.call(this, prop, value);
          }
        }
      });
    });

    // Custom methods
    Object.entries(definition.methods).forEach(([methodName, method]) => {
      if (!['connected', 'disconnected', 'attributeChanged', 'propertyChanged'].includes(methodName)) {
        (ComponentClass.prototype as any)[methodName] = method.bind(ComponentClass.prototype);
      }
    });

    return ComponentClass;
  }

  /**
   * Initialize built-in components
   */
  initializeBuiltInComponents(): void {
    if (this.initialized) {
      console.warn('WebComponentsEngine already initialized, skipping');
      return;
    }
    // Register basic shape components
    this.registerComponent({
      tagName: 'template-shape',
      className: 'TemplateShape',
      template: `
        <div class="shape {{shapeType}}" style="width: {{width}}px; height: {{height}}px; background-color: {{color}};">
          <span class="shape-label">{{label}}</span>
        </div>
      `,
      styles: `
        .shape {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          border: 1px solid #ccc;
          position: relative;
        }
        .shape.rectangle { border-radius: 0; }
        .shape.circle { border-radius: 50%; }
        .shape.diamond {
          transform: rotate(45deg);
          width: calc({{width}}px * 0.707);
          height: calc({{height}}px * 0.707);
        }
        .shape-label {
          font-size: 12px;
          font-weight: bold;
          color: #333;
          text-align: center;
        }
      `,
      properties: {
        shapeType: { type: 'string', defaultValue: 'rectangle' },
        width: { type: 'number', defaultValue: 100 },
        height: { type: 'number', defaultValue: 60 },
        color: { type: 'string', defaultValue: '#e1f5fe' },
        label: { type: 'string', defaultValue: 'Shape' }
      },
      methods: {
        connected: function() {
          console.log(`Shape component connected: ${this.label}`);
        },
        update: function() {
          this.render();
        }
      },
      events: ['click', 'dblclick']
    });

    // Register text component
    this.registerComponent({
      tagName: 'template-text',
      className: 'TemplateText',
      template: `
        <div class="text-component" style="font-size: {{fontSize}}px; color: {{color}}; font-weight: {{fontWeight}};">
          {{content}}
        </div>
      `,
      styles: `
        .text-component {
          padding: 8px;
          border-radius: 4px;
          background-color: transparent;
          min-width: 50px;
          min-height: 20px;
        }
      `,
      properties: {
        content: { type: 'string', defaultValue: 'Text content' },
        fontSize: { type: 'number', defaultValue: 14 },
        color: { type: 'string', defaultValue: '#333333' },
        fontWeight: { type: 'string', defaultValue: 'normal' }
      },
      methods: {
        update: function() {
          this.render();
        }
      },
      events: ['click', 'dblclick', 'input']
    });

    this.initialized = true;
    console.log('Initialized built-in template components');
  }
}

// Template Builder implementation
export class TemplateComponentBuilder implements TemplateBuilder {
  private engine: WebComponentsEngine;

  constructor(engine: WebComponentsEngine) {
    this.engine = engine;
  }

  createComponent(type: ComponentType, props: Record<string, any> = {}): TemplateComponent {
    const component: TemplateComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Component`,
      description: `A ${type} component`,
      props: {
        ...this.getDefaultProps(type),
        ...props
      },
      validation: this.getValidationRules(type)
    };

    return component;
  }

  updateComponent(id: string, updates: Partial<TemplateComponent>): TemplateComponent {
    // This would typically update an existing component in a store
    // For now, return a mock updated component
    return {
      id,
      ...updates
    } as TemplateComponent;
  }

  deleteComponent(id: string): void {
    // Remove component from store/template
    console.log(`Deleting component: ${id}`);
  }

  addChild(parentId: string, child: TemplateComponent): void {
    // Add child component to parent
    console.log(`Adding child ${child.id} to parent ${parentId}`);
  }

  moveComponent(id: string, newParentId: string, index?: number): void {
    // Move component to new parent
    console.log(`Moving component ${id} to parent ${newParentId} at index ${index}`);
  }

  cloneComponent(id: string): TemplateComponent {
    // Clone existing component
    const cloned: TemplateComponent = {
      id: `cloned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'custom',
      name: 'Cloned Component',
      description: 'A cloned component',
      props: {}
    };

    return cloned;
  }

  validateTemplate(template: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: any[] = [];

    // Basic validation logic
    if (!template.components || template.components.length === 0) {
      errors.push({
        message: 'Template must have at least one component',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  generateCode(template: any): string {
    // Generate code for the template (could be HTML, React, etc.)
    return `// Generated template code for ${template.metadata?.name || 'Template'}`;
  }

  private getDefaultProps(type: ComponentType): Record<string, any> {
    const defaultProps: Record<ComponentType, Record<string, any>> = {
      container: { width: 300, height: 200, backgroundColor: '#ffffff' },
      text: { content: 'Sample text', fontSize: 14, color: '#333333' },
      image: { src: '', alt: '', width: 100, height: 100 },
      shape: { shapeType: 'rectangle', width: 100, height: 60, color: '#e1f5fe' },
      icon: { name: 'star', size: 24, color: '#666666' },
      input: { type: 'text', placeholder: 'Enter value', required: false },
      button: { text: 'Click me', variant: 'primary', size: 'medium' },
      chart: { type: 'bar', data: [], width: 400, height: 300 },
      table: { columns: [], data: [], sortable: true },
      connector: { source: '', target: '', type: 'straight', color: '#666666' },
      custom: {}
    };

    return defaultProps[type] || {};
  }

  private getValidationRules(type: ComponentType): any {
    // Return validation rules for component type
    return {
      required: ['id', 'type'],
      customRule: `validate${type.charAt(0).toUpperCase() + type.slice(1)}Component`
    };
  }
}

// Singleton instances
export const webComponentsEngine = new WebComponentsEngine();
export const templateComponentBuilder = new TemplateComponentBuilder(webComponentsEngine);
