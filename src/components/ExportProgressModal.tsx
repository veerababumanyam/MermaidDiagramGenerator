/**
 * Export Progress Component
 * Shows progress, errors, and success notifications for export operations
 */

import React, { useEffect, useState } from 'react';
import type { ExportProgress, ExportResult, ExportError } from '../types/export';

interface ExportProgressModalProps {
  isOpen: boolean;
  progress?: ExportProgress;
  result?: ExportResult;
  onClose: () => void;
  onRetry?: () => void;
  onDownload?: (result: ExportResult) => void;
}

const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  progress,
  result,
  onClose,
  onRetry,
  onDownload
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen || !progress || progress.stage === 'complete' || progress.stage === 'error') {
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, progress?.stage]);

  useEffect(() => {
    if (progress) {
      setTimeElapsed(progress.timeElapsed);
    }
  }, [progress]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getProgressBarColor = (): string => {
    if (!progress) return 'bg-blue-600';
    
    switch (progress.stage) {
      case 'error':
        return 'bg-red-600';
      case 'complete':
        return 'bg-green-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getIcon = () => {
    if (!progress) return null;

    switch (progress.stage) {
      case 'preparing':
        return (
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'rendering':
      case 'processing':
      case 'finalizing':
        return (
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'complete':
        return (
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Export Progress
            </h3>
            {(progress?.stage === 'complete' || progress?.stage === 'error') && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Icon and Status */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {progress?.message || 'Preparing export...'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(timeElapsed)} elapsed
                  {progress?.estimatedTimeRemaining && (
                    <span> • ~{formatTime(progress.estimatedTimeRemaining)} remaining</span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {progress && progress.stage !== 'error' && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            )}

            {/* Success Result */}
            {result && result.success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
                  <div className="font-medium">Export completed successfully!</div>
                  <div className="text-xs space-y-1">
                    <div>Format: {result.format.toUpperCase()}</div>
                    <div>File size: {formatFileSize(result.fileSize)}</div>
                    <div>Dimensions: {result.dimensions.width} × {result.dimensions.height}px</div>
                    <div>Processing time: {formatTime(result.processingTime)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Result */}
            {(result?.error || progress?.stage === 'error') && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-sm text-red-800 dark:text-red-200 space-y-2">
                  <div className="font-medium">Export failed</div>
                  <div className="text-xs">
                    {result?.error?.message || progress?.message || 'Unknown error occurred'}
                  </div>
                  
                  {/* Error Details */}
                  {result?.error?.code && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      Error code: {result.error.code}
                    </div>
                  )}

                  {/* Suggestions */}
                  {result?.error?.suggestions && result.error.suggestions.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                        Suggestions:
                      </div>
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                        {result.error.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            {progress?.stage === 'error' && onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
            
            {result?.success && result.blob && onDownload && (
              <button
                onClick={() => onDownload(result)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            )}
            
            {(progress?.stage === 'complete' || progress?.stage === 'error') && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportProgressModal;