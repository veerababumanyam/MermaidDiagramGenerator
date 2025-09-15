/**
 * Diagram Plugin Manager
 * Manages loading, registration, and execution of diagram plugins
 */

import type {
  DiagramPlugin,
  DiagramRenderer,
  AIEnhancer,
  DiagramValidator,
  DiagramData,
  DiagramType,
  RenderConfig,
  RenderResult,
  ValidationResult,
  AIAnalysis,
  AISuggestion
} from '../../types/diagrams';

export class PluginManager {
  private plugins: Map<string, DiagramPlugin> = new Map();
  private loadedPlugins: Set<string> = new Set();
  private initialized = false;

  /**
   * Register a new diagram plugin
   */
  register(plugin: DiagramPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered, skipping`);
      return;
    }

    this.plugins.set(plugin.id, plugin);
    console.log(`Registered diagram plugin: ${plugin.name} (${plugin.version})`);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    if (this.plugins.delete(pluginId)) {
      this.loadedPlugins.delete(pluginId);
      console.log(`Unregistered diagram plugin: ${pluginId}`);
    }
  }

  /**
   * Load a plugin (lazy loading)
   */
  async load(pluginId: string): Promise<DiagramPlugin> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!this.loadedPlugins.has(pluginId)) {
      // Load dependencies if specified
      if (plugin.dependencies) {
        await this.loadDependencies(plugin.dependencies);
      }

      this.loadedPlugins.add(pluginId);
      console.log(`Loaded diagram plugin: ${plugin.name}`);
    }

    return plugin;
  }

  /**
   * Get a plugin by ID
   */
  get(pluginId: string): DiagramPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all registered plugins
   */
  getAll(): DiagramPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by type
   */
  getByType(type: DiagramType): DiagramPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.type === type);
  }

  /**
   * Check if a plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }

  /**
   * Render a diagram using the appropriate plugin
   */
  async render(data: DiagramData, config: RenderConfig = {}): Promise<RenderResult> {
    const plugin = await this.load(data.type);
    return plugin.renderer.render(data, config);
  }

  /**
   * Update a rendered diagram
   */
  async update(element: HTMLElement, data: DiagramData, config: RenderConfig = {}): Promise<void> {
    const plugin = await this.load(data.type);
    return plugin.renderer.update(element, data, config);
  }

  /**
   * Destroy a rendered diagram
   */
  async destroy(element: HTMLElement, data: DiagramData): Promise<void> {
    const plugin = await this.load(data.type);
    return plugin.renderer.destroy(element);
  }

  /**
   * Validate diagram data using the appropriate plugin
   */
  async validate(data: DiagramData): Promise<ValidationResult> {
    const plugin = await this.load(data.type);
    return plugin.validator.validate(data, data.type);
  }

  /**
   * Analyze diagram using AI (if available)
   */
  async analyze(data: DiagramData): Promise<AIAnalysis | null> {
    const plugin = await this.load(data.type);
    if (!plugin.aiEnhancer) {
      return null;
    }
    return plugin.aiEnhancer.analyze(data);
  }

  /**
   * Optimize diagram using AI (if available)
   */
  async optimize(data: DiagramData): Promise<DiagramData> {
    const plugin = await this.load(data.type);
    if (!plugin.aiEnhancer) {
      return data;
    }
    return plugin.aiEnhancer.optimize(data);
  }

  /**
   * Get AI suggestions for diagram (if available)
   */
  async suggest(data: DiagramData): Promise<AISuggestion[]> {
    const plugin = await this.load(data.type);
    if (!plugin.aiEnhancer) {
      return [];
    }
    return plugin.aiEnhancer.suggest(data);
  }

  /**
   * Check if a diagram type is supported
   */
  supports(type: DiagramType): boolean {
    return Array.from(this.plugins.values()).some(plugin => plugin.type === type);
  }

  /**
   * Get supported export formats for a diagram type
   */
  getSupportedFormats(type: DiagramType): string[] {
    const plugins = this.getByType(type);
    if (plugins.length === 0) return [];
    return plugins[0].supportedFormats;
  }

  /**
   * Load plugin dependencies
   */
  private async loadDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        console.warn(`Dependency ${dep} not found, skipping`);
        continue;
      }
      await this.load(dep);
    }
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): Record<string, any> {
    const metadata: Record<string, any> = {};

    for (const [id, plugin] of this.plugins) {
      metadata[id] = {
        name: plugin.name,
        version: plugin.version,
        type: plugin.type,
        description: plugin.description,
        author: plugin.author,
        loaded: this.loadedPlugins.has(id)
      };
    }

    return metadata;
  }

  /**
   * Initialize built-in plugins
   */
  initializeBuiltInPlugins(): void {
    if (this.initialized) {
      console.warn('PluginManager already initialized, skipping');
      return;
    }

    console.log('Initializing built-in diagram plugins...');

    // Import and register built-in plugins
    import('./VennDiagramPlugin').then(({ VennDiagramPlugin }) => {
      this.register(VennDiagramPlugin);
    }).catch(error => console.error('Failed to load VennDiagramPlugin:', error));

    import('./SwimlaneDiagramPlugin').then(({ SwimlaneDiagramPlugin }) => {
      this.register(SwimlaneDiagramPlugin);
    }).catch(error => console.error('Failed to load SwimlaneDiagramPlugin:', error));

    import('./MindMapDiagramPlugin').then(({ MindMapDiagramPlugin }) => {
      this.register(MindMapDiagramPlugin);
    }).catch(error => console.error('Failed to load MindMapDiagramPlugin:', error));

    import('./TimelineDiagramPlugin').then(({ TimelineDiagramPlugin }) => {
      this.register(TimelineDiagramPlugin);
    }).catch(error => console.error('Failed to load TimelineDiagramPlugin:', error));

    import('./NetworkDiagramPlugin').then(({ NetworkDiagramPlugin }) => {
      this.register(NetworkDiagramPlugin);
    }).catch(error => console.error('Failed to load NetworkDiagramPlugin:', error));

    this.initialized = true;
  }
}

// Singleton instance
export const diagramPluginManager = new PluginManager();
