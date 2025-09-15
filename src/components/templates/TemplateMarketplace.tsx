/**
 * Template Marketplace Component
 * Browse, search, and download community templates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { templateMarketplace } from '../../../src/services/TemplateMarketplace';
import { useAppStore } from '../../../store/useAppStore';
import type { MarketplaceTemplate, TemplateFilters, TemplateCategory, MarketplaceStats } from '../../../src/services/TemplateMarketplace';
import { IconSearch, IconDownload, IconStar, IconUser } from '../../../components/Icons';

interface TemplateMarketplaceProps {
  onTemplateSelect: (template: MarketplaceTemplate) => void;
  onClose: () => void;
}

const TemplateMarketplace: React.FC<TemplateMarketplaceProps> = ({
  onTemplateSelect,
  onClose
}) => {
  const { setCode } = useAppStore();

  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<MarketplaceTemplate[]>([]);
  const [trendingTemplates, setTrendingTemplates] = useState<MarketplaceTemplate[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'downloads' | 'recent' | 'relevance'>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load templates when filters change
  useEffect(() => {
    loadTemplates();
  }, [searchQuery, filters, selectedCategory, sortBy, currentPage]);

  const loadInitialData = async () => {
    try {
      const [featured, trending, marketplaceStats] = await Promise.all([
        templateMarketplace.getFeaturedTemplates(),
        templateMarketplace.getTrendingTemplates(),
        templateMarketplace.getStats()
      ]);

      setFeaturedTemplates(featured);
      setTrendingTemplates(trending);
      setStats(marketplaceStats);
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const categoryFilter = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const searchFilters = { ...filters, ...categoryFilter };

      let results;
      if (searchQuery.trim()) {
        results = await templateMarketplace.searchTemplates(searchQuery, searchFilters);
      } else {
        const response = await templateMarketplace.getTemplates(searchFilters, currentPage, 20);
        results = response.templates;
      }

      // Sort results
      const sortedResults = sortTemplates(results, sortBy);
      setTemplates(sortedResults);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const sortTemplates = (templates: MarketplaceTemplate[], sortBy: string): MarketplaceTemplate[] => {
    switch (sortBy) {
      case 'rating':
        return [...templates].sort((a, b) => b.rating - a.rating);
      case 'downloads':
        return [...templates].sort((a, b) => b.downloads - a.downloads);
      case 'recent':
        return [...templates].sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      case 'relevance':
      default:
        return templates; // Already sorted by relevance in the service
    }
  };

  const handleTemplateDownload = async (template: MarketplaceTemplate) => {
    try {
      const templateData = await templateMarketplace.downloadTemplate(template.marketplaceId);
      setCode(JSON.stringify(templateData, null, 2)); // For now, just set as JSON
      onTemplateSelect(template);
      onClose();
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const categories: { value: TemplateCategory | 'all', label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'business', label: 'Business' },
    { value: 'technical', label: 'Technical' },
    { value: 'education', label: 'Education' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'project-management', label: 'Project Management' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'data-flow', label: 'Data Flow' },
    { value: 'user-experience', label: 'User Experience' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="template-marketplace fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Template Marketplace</h2>
            <p className="text-gray-600 mt-1">Discover and use community-created diagram templates</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>{stats.totalTemplates.toLocaleString()} templates</span>
              <span>{stats.totalUsers.toLocaleString()} creators</span>
              <span>{stats.totalDownloads.toLocaleString()} downloads</span>
              <span>{stats.featuredTemplates} featured</span>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated</option>
              <option value="downloads">Most Downloaded</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Featured Templates */}
            {featuredTemplates.length > 0 && !searchQuery && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredTemplates.slice(0, 6).map(template => (
                    <TemplateCard
                      key={template.marketplaceId}
                      template={template}
                      onDownload={handleTemplateDownload}
                      onViewDetails={setSelectedTemplate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Templates */}
            {trendingTemplates.length > 0 && !searchQuery && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending This Week</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trendingTemplates.slice(0, 8).map(template => (
                    <TemplateCard
                      key={template.marketplaceId}
                      template={template}
                      compact
                      onDownload={handleTemplateDownload}
                      onViewDetails={setSelectedTemplate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results / All Templates */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {searchQuery ? `Search Results for "${searchQuery}"` : 'All Templates'}
              </h3>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No templates found</p>
                  <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {templates.map(template => (
                    <TemplateCard
                      key={template.marketplaceId}
                      template={template}
                      onDownload={handleTemplateDownload}
                      onViewDetails={setSelectedTemplate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <TemplateDetailsModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onDownload={handleTemplateDownload}
        />
      )}
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: MarketplaceTemplate;
  compact?: boolean;
  onDownload: (template: MarketplaceTemplate) => void;
  onViewDetails: (template: MarketplaceTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  compact = false,
  onDownload,
  onViewDetails
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${compact ? 'p-4' : 'p-0'}`}>
      {/* Thumbnail */}
      {template.screenshots[0] && !compact && (
        <div className="h-32 bg-gray-100 flex items-center justify-center">
          <img
            src={template.screenshots[0]}
            alt={template.metadata.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      <div className={compact ? '' : 'p-4'}>
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 truncate">{template.metadata.name}</h4>
          {template.featured && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Featured
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {template.metadata.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <IconStar className="w-4 h-4" />
            <span>{template.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <IconDownload className="w-4 h-4" />
            <span>{template.downloads}</span>
          </div>
          <div className="flex items-center gap-1">
            <IconUser className="w-4 h-4" />
            <span>{template.author.displayName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(template)}
            className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onDownload(template)}
            className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
          >
            <IconDownload className="w-4 h-4" />
            Use
          </button>
        </div>
      </div>
    </div>
  );
};

// Template Details Modal Component
interface TemplateDetailsModalProps {
  template: MarketplaceTemplate;
  onClose: () => void;
  onDownload: (template: MarketplaceTemplate) => void;
}

const TemplateDetailsModal: React.FC<TemplateDetailsModalProps> = ({
  template,
  onClose,
  onDownload
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{template.metadata.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="flex">
          {/* Screenshots */}
          <div className="w-1/2 p-6 border-r border-gray-200">
            <div className="space-y-4">
              {template.screenshots.map((screenshot, index) => (
                <img
                  key={index}
                  src={screenshot}
                  alt={`${template.metadata.name} screenshot ${index + 1}`}
                  className="w-full rounded-lg border border-gray-200"
                />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="w-1/2 p-6">
            <div className="mb-6">
              <p className="text-gray-600 mb-4">{template.metadata.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="font-medium text-gray-900">Rating:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <IconStar className="w-4 h-4 text-yellow-400" />
                    <span>{template.rating.toFixed(1)} ({template.reviewCount} reviews)</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Downloads:</span>
                  <span className="ml-2">{template.downloads.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Category:</span>
                  <span className="ml-2 capitalize">{template.metadata.category.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Complexity:</span>
                  <span className="ml-2 capitalize">{template.metadata.complexity}</span>
                </div>
              </div>

              <div className="mb-4">
                <span className="font-medium text-gray-900">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {template.tags.map(tag => (
                    <span key={tag} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <span className="font-medium text-gray-900">Author:</span>
                <div className="flex items-center gap-2 mt-1">
                  <IconUser className="w-4 h-4 text-gray-400" />
                  <span>{template.author.displayName}</span>
                  <span className="text-gray-500">({template.author.reputation} rep)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onDownload(template)}
                className="flex-1 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <IconDownload className="w-5 h-5" />
                Use This Template
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateMarketplace;
