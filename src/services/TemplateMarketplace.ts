/**
 * Template Marketplace Service
 * Manages community template sharing, discovery, and distribution
 */

import type {
  Template,
  TemplateMetadata,
  TemplateMarketplace,
  TemplateFilters,
  TemplateCategory
} from '../types/templates';

export interface MarketplaceTemplate extends Template {
  marketplaceId: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  screenshots: string[];
  author: MarketplaceUser;
  publishedAt: Date;
  lastUpdated: Date;
  version: string;
  compatibility: string[];
  featured: boolean;
  verified: boolean;
}

export interface MarketplaceUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  reputation: number;
  templatesCount: number;
  joinedAt: Date;
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  user: MarketplaceUser;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
}

export interface TemplateSubmission {
  template: Template;
  screenshots: File[];
  description: string;
  tags: string[];
  category: TemplateCategory;
  license: string;
  allowCommercial: boolean;
  allowModifications: boolean;
}

export interface MarketplaceStats {
  totalTemplates: number;
  totalUsers: number;
  totalDownloads: number;
  featuredTemplates: number;
  categories: Record<TemplateCategory, number>;
  trendingTemplates: string[];
  popularAuthors: MarketplaceUser[];
}

export class TemplateMarketplaceService {
  private static instance: TemplateMarketplaceService;
  private templates: Map<string, MarketplaceTemplate> = new Map();
  private reviews: Map<string, TemplateReview[]> = new Map();
  private userProfiles: Map<string, MarketplaceUser> = new Map();

  private constructor() {
    this.initializeDefaultData();
  }

  static getInstance(): TemplateMarketplaceService {
    if (!TemplateMarketplaceService.instance) {
      TemplateMarketplaceService.instance = new TemplateMarketplaceService();
    }
    return TemplateMarketplaceService.instance;
  }

  /**
   * Get all marketplace templates with optional filtering
   */
  async getTemplates(filters?: TemplateFilters, page: number = 1, limit: number = 20): Promise<{
    templates: MarketplaceTemplate[];
    total: number;
    hasMore: boolean;
  }> {
    let allTemplates = Array.from(this.templates.values());

    // Apply filters
    if (filters) {
      allTemplates = this.applyFilters(allTemplates, filters);
    }

    // Sort by relevance/popularity
    allTemplates.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, filters);
      const scoreB = this.calculateRelevanceScore(b, filters);
      return scoreB - scoreA;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTemplates = allTemplates.slice(startIndex, endIndex);

    return {
      templates: paginatedTemplates,
      total: allTemplates.length,
      hasMore: endIndex < allTemplates.length
    };
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(limit: number = 10): Promise<MarketplaceTemplate[]> {
    const featured = Array.from(this.templates.values())
      .filter(template => template.featured)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return featured;
  }

  /**
   * Get trending templates (based on recent downloads/ratings)
   */
  async getTrendingTemplates(limit: number = 10): Promise<MarketplaceTemplate[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const trending = Array.from(this.templates.values())
      .filter(template => template.publishedAt > thirtyDaysAgo)
      .sort((a, b) => {
        const scoreA = (a.downloads * 0.7) + (a.rating * a.reviewCount * 0.3);
        const scoreB = (b.downloads * 0.7) + (b.rating * b.reviewCount * 0.3);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return trending;
  }

  /**
   * Search templates by query
   */
  async searchTemplates(query: string, filters?: TemplateFilters): Promise<MarketplaceTemplate[]> {
    const searchTerm = query.toLowerCase();
    let templates = Array.from(this.templates.values());

    // Apply text search
    templates = templates.filter(template =>
      template.metadata.name.toLowerCase().includes(searchTerm) ||
      template.metadata.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      template.author.username.toLowerCase().includes(searchTerm)
    );

    // Apply additional filters
    if (filters) {
      templates = this.applyFilters(templates, filters);
    }

    // Sort by relevance
    templates.sort((a, b) => this.calculateRelevanceScore(a, filters) - this.calculateRelevanceScore(b, filters));

    return templates.slice(0, 50); // Limit results
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<MarketplaceTemplate | null> {
    return this.templates.get(id) || null;
  }

  /**
   * Get reviews for a template
   */
  async getTemplateReviews(templateId: string, page: number = 1, limit: number = 10): Promise<{
    reviews: TemplateReview[];
    total: number;
    averageRating: number;
  }> {
    const allReviews = this.reviews.get(templateId) || [];
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
      : 0;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = allReviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(startIndex, endIndex);

    return {
      reviews: paginatedReviews,
      total: allReviews.length,
      averageRating
    };
  }

  /**
   * Submit a template to the marketplace
   */
  async submitTemplate(submission: TemplateSubmission, authorId: string): Promise<MarketplaceTemplate> {
    const marketplaceId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate template
    await this.validateTemplate(submission.template);

    // Process screenshots
    const screenshotUrls = await this.processScreenshots(submission.screenshots);

    // Create marketplace template
    const author = this.userProfiles.get(authorId);
    if (!author) {
      throw new Error('Author profile not found');
    }

    const marketplaceTemplate: MarketplaceTemplate = {
      ...submission.template,
      marketplaceId,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      tags: submission.tags,
      screenshots: screenshotUrls,
      author,
      publishedAt: new Date(),
      lastUpdated: new Date(),
      version: '1.0.0',
      compatibility: ['latest'],
      featured: false,
      verified: false
    };

    this.templates.set(marketplaceId, marketplaceTemplate);

    // Update author's template count
    author.templatesCount++;

    return marketplaceTemplate;
  }

  /**
   * Download a template
   */
  async downloadTemplate(templateId: string, userId?: string): Promise<Template> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Increment download count
    template.downloads++;

    // Record download for analytics
    await this.recordDownload(templateId, userId);

    return {
      metadata: template.metadata,
      components: template.components,
      styles: template.styles,
      scripts: template.scripts,
      dependencies: template.dependencies,
      config: template.config
    };
  }

  /**
   * Rate and review a template
   */
  async addReview(templateId: string, userId: string, rating: number, comment: string): Promise<TemplateReview> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const user = this.userProfiles.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already reviewed
    const existingReviews = this.reviews.get(templateId) || [];
    const existingReview = existingReviews.find(review => review.userId === userId);

    if (existingReview) {
      throw new Error('User has already reviewed this template');
    }

    const review: TemplateReview = {
      id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      userId,
      user,
      rating: Math.max(1, Math.min(5, rating)), // Clamp to 1-5
      comment: comment.trim(),
      createdAt: new Date(),
      helpful: 0
    };

    if (!this.reviews.has(templateId)) {
      this.reviews.set(templateId, []);
    }
    this.reviews.get(templateId)!.push(review);

    // Update template rating
    await this.updateTemplateRating(templateId);

    return review;
  }

  /**
   * Get marketplace statistics
   */
  async getStats(): Promise<MarketplaceStats> {
    const templates = Array.from(this.templates.values());
    const users = Array.from(this.userProfiles.values());

    const categories: Record<TemplateCategory, number> = {
      'business': 0,
      'technical': 0,
      'education': 0,
      'design': 0,
      'marketing': 0,
      'project-management': 0,
      'infrastructure': 0,
      'data-flow': 0,
      'user-experience': 0,
      'custom': 0
    };

    templates.forEach(template => {
      categories[template.metadata.category]++;
    });

    const totalDownloads = templates.reduce((sum, template) => sum + template.downloads, 0);

    const trendingTemplates = await this.getTrendingTemplates(10);
    const popularAuthors = users
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 10);

    return {
      totalTemplates: templates.length,
      totalUsers: users.length,
      totalDownloads,
      featuredTemplates: templates.filter(t => t.featured).length,
      categories,
      trendingTemplates: trendingTemplates.map(t => t.marketplaceId),
      popularAuthors
    };
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<MarketplaceUser | null> {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Create or update user profile
   */
  async updateUserProfile(userId: string, profile: Partial<MarketplaceUser>): Promise<MarketplaceUser> {
    const existing = this.userProfiles.get(userId);

    if (existing) {
      const updated = { ...existing, ...profile };
      this.userProfiles.set(userId, updated);
      return updated;
    } else {
      const newProfile: MarketplaceUser = {
        id: userId,
        username: profile.username || `user${userId.slice(0, 8)}`,
        displayName: profile.displayName || profile.username || `User ${userId.slice(0, 8)}`,
        avatar: profile.avatar,
        reputation: 0,
        templatesCount: 0,
        joinedAt: new Date(),
        ...profile
      };
      this.userProfiles.set(userId, newProfile);
      return newProfile;
    }
  }

  // Private helper methods
  private applyFilters(templates: MarketplaceTemplate[], filters: TemplateFilters): MarketplaceTemplate[] {
    return templates.filter(template => {
      if (filters.category && template.metadata.category !== filters.category) return false;
      if (filters.complexity && template.metadata.complexity !== filters.complexity) return false;
      if (filters.author && template.author.username !== filters.author) return false;
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag =>
          template.tags.some(templateTag => templateTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) return false;
      }
      if (filters.rating && template.rating < filters.rating) return false;
      if (filters.aiGenerated !== undefined && template.metadata.aiGenerated !== filters.aiGenerated) return false;

      return true;
    });
  }

  private calculateRelevanceScore(template: MarketplaceTemplate, filters?: TemplateFilters): number {
    let score = 0;

    // Base popularity score
    score += template.rating * 0.3;
    score += Math.log(template.downloads + 1) * 0.3;
    score += template.reviewCount * 0.1;

    // Recency bonus
    const daysSincePublished = (Date.now() - template.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, (30 - daysSincePublished) / 30) * 0.2;

    // Featured bonus
    if (template.featured) score += 0.1;

    // Verified bonus
    if (template.verified) score += 0.1;

    return score;
  }

  private async validateTemplate(template: Template): Promise<void> {
    // Basic validation
    if (!template.metadata.name) {
      throw new Error('Template must have a name');
    }

    if (!template.components || template.components.length === 0) {
      throw new Error('Template must have at least one component');
    }

    // Check for duplicate component IDs
    const componentIds = template.components.map(c => c.id);
    const uniqueIds = new Set(componentIds);
    if (componentIds.length !== uniqueIds.size) {
      throw new Error('Template contains duplicate component IDs');
    }
  }

  private async processScreenshots(files: File[]): Promise<string[]> {
    // In a real implementation, this would upload files to a storage service
    // For now, return placeholder URLs
    return files.map((file, index) => `/screenshots/${Date.now()}-${index}.png`);
  }

  private async recordDownload(templateId: string, userId?: string): Promise<void> {
    // In a real implementation, this would record analytics data
    console.log(`Template ${templateId} downloaded by user ${userId || 'anonymous'}`);
  }

  private async updateTemplateRating(templateId: string): Promise<void> {
    const reviews = this.reviews.get(templateId) || [];
    if (reviews.length === 0) return;

    const template = this.templates.get(templateId);
    if (!template) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    template.rating = totalRating / reviews.length;
    template.reviewCount = reviews.length;
  }

  private initializeDefaultData(): void {
    // Initialize with some sample data for development
    const sampleUser: MarketplaceUser = {
      id: 'user-1',
      username: 'diagram-expert',
      displayName: 'Diagram Expert',
      reputation: 100,
      templatesCount: 5,
      joinedAt: new Date('2024-01-01')
    };

    this.userProfiles.set(sampleUser.id, sampleUser);

    // Sample templates would be initialized here
    console.log('Template Marketplace initialized with default data');
  }
}

// Export singleton instance
export const templateMarketplace = TemplateMarketplaceService.getInstance();
