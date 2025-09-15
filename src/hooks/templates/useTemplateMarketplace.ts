/**
 * Template Marketplace Hook
 * Manages marketplace interactions, search, filtering, and downloads
 */

import { useState, useCallback, useEffect } from 'react';
import { templateMarketplace, MarketplaceTemplate, TemplateFilters, TemplateCategory } from '../../src/services/TemplateMarketplace';

export interface UseTemplateMarketplaceOptions {
  autoLoad?: boolean;
  initialFilters?: TemplateFilters;
  initialCategory?: TemplateCategory | 'all';
}

export interface TemplateMarketplaceState {
  templates: MarketplaceTemplate[];
  featuredTemplates: MarketplaceTemplate[];
  trendingTemplates: MarketplaceTemplate[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: TemplateFilters;
  selectedCategory: TemplateCategory | 'all';
  sortBy: 'rating' | 'downloads' | 'recent' | 'relevance';
  currentPage: number;
  hasMore: boolean;
  totalCount: number;
}

export const useTemplateMarketplace = (options: UseTemplateMarketplaceOptions = {}) => {
  const {
    autoLoad = true,
    initialFilters = {},
    initialCategory = 'all'
  } = options;

  const [state, setState] = useState<TemplateMarketplaceState>({
    templates: [],
    featuredTemplates: [],
    trendingTemplates: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: initialFilters,
    selectedCategory: initialCategory,
    sortBy: 'relevance',
    currentPage: 1,
    hasMore: false,
    totalCount: 0
  });

  // Load initial marketplace data
  useEffect(() => {
    if (autoLoad) {
      loadInitialData();
    }
  }, [autoLoad]);

  // Load templates when search/filters change
  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
    }
  }, [state.searchQuery, state.filters, state.selectedCategory, state.sortBy, state.currentPage, autoLoad]);

  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [featured, trending] = await Promise.all([
        templateMarketplace.getFeaturedTemplates(),
        templateMarketplace.getTrendingTemplates()
      ]);

      setState(prev => ({
        ...prev,
        featuredTemplates: featured,
        trendingTemplates: trending,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load marketplace data',
        loading: false
      }));
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const categoryFilter = state.selectedCategory !== 'all'
        ? { category: state.selectedCategory }
        : {};

      const searchFilters = { ...state.filters, ...categoryFilter };

      let results;
      if (state.searchQuery.trim()) {
        results = await templateMarketplace.searchTemplates(state.searchQuery, searchFilters);
        setState(prev => ({
          ...prev,
          templates: results,
          totalCount: results.length,
          hasMore: false,
          loading: false
        }));
      } else {
        const response = await templateMarketplace.getTemplates(
          searchFilters,
          state.currentPage,
          20
        );

        setState(prev => ({
          ...prev,
          templates: state.currentPage === 1
            ? response.templates
            : [...prev.templates, ...response.templates],
          totalCount: response.total,
          hasMore: response.hasMore,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load templates',
        loading: false
      }));
    }
  }, [state.searchQuery, state.filters, state.selectedCategory, state.sortBy, state.currentPage]);

  const searchTemplates = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      currentPage: 1
    }));
  }, []);

  const setFilters = useCallback((filters: TemplateFilters) => {
    setState(prev => ({
      ...prev,
      filters,
      currentPage: 1
    }));
  }, []);

  const setCategory = useCallback((category: TemplateCategory | 'all') => {
    setState(prev => ({
      ...prev,
      selectedCategory: category,
      currentPage: 1
    }));
  }, []);

  const setSortBy = useCallback((sortBy: 'rating' | 'downloads' | 'recent' | 'relevance') => {
    setState(prev => ({
      ...prev,
      sortBy,
      currentPage: 1
    }));
  }, []);

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.loading) {
      setState(prev => ({
        ...prev,
        currentPage: prev.currentPage + 1
      }));
    }
  }, [state.hasMore, state.loading]);

  const downloadTemplate = useCallback(async (templateId: string, userId?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const templateData = await templateMarketplace.downloadTemplate(templateId, userId);

      // Update local template data
      setState(prev => ({
        ...prev,
        templates: prev.templates.map(t =>
          t.marketplaceId === templateId
            ? { ...t, downloads: t.downloads + 1 }
            : t
        ),
        featuredTemplates: prev.featuredTemplates.map(t =>
          t.marketplaceId === templateId
            ? { ...t, downloads: t.downloads + 1 }
            : t
        ),
        trendingTemplates: prev.trendingTemplates.map(t =>
          t.marketplaceId === templateId
            ? { ...t, downloads: t.downloads + 1 }
            : t
        ),
        loading: false
      }));

      return templateData;
    } catch (error) {
      console.error('Failed to download template:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to download template',
        loading: false
      }));
      throw error;
    }
  }, []);

  const getTemplateDetails = useCallback(async (templateId: string) => {
    try {
      return await templateMarketplace.getTemplate(templateId);
    } catch (error) {
      console.error('Failed to get template details:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load template details'
      }));
      throw error;
    }
  }, []);

  const getTemplateReviews = useCallback(async (templateId: string, page: number = 1, limit: number = 10) => {
    try {
      return await templateMarketplace.getTemplateReviews(templateId, page, limit);
    } catch (error) {
      console.error('Failed to get template reviews:', error);
      throw error;
    }
  }, []);

  const submitReview = useCallback(async (templateId: string, userId: string, rating: number, comment: string) => {
    try {
      const review = await templateMarketplace.addReview(templateId, userId, rating, comment);

      // Update local template data
      setState(prev => ({
        ...prev,
        templates: prev.templates.map(t =>
          t.marketplaceId === templateId
            ? { ...t, reviewCount: t.reviewCount + 1 }
            : t
        ),
        featuredTemplates: prev.featuredTemplates.map(t =>
          t.marketplaceId === templateId
            ? { ...t, reviewCount: t.reviewCount + 1 }
            : t
        ),
        trendingTemplates: prev.trendingTemplates.map(t =>
          t.marketplaceId === templateId
            ? { ...t, reviewCount: t.reviewCount + 1 }
            : t
        )
      }));

      return review;
    } catch (error) {
      console.error('Failed to submit review:', error);
      throw error;
    }
  }, []);

  const refreshData = useCallback(() => {
    loadInitialData();
    loadTemplates();
  }, [loadInitialData, loadTemplates]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    searchTemplates,
    setFilters,
    setCategory,
    setSortBy,
    loadMore,
    downloadTemplate,
    getTemplateDetails,
    getTemplateReviews,
    submitReview,
    refreshData,
    clearError,

    // Computed values
    hasActiveFilters: Object.keys(state.filters).length > 0 || state.selectedCategory !== 'all',
    isSearching: state.searchQuery.trim().length > 0,
    hasResults: state.templates.length > 0,
    canLoadMore: state.hasMore && !state.loading
  };
};
