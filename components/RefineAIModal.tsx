
import React from 'react';

interface RefineAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onRefine: () => void;
  isLoading: boolean;
}

const RefineAIModal: React.FC<RefineAIModalProps> = ({
  isOpen,
  onClose,
  prompt,
  setPrompt,
  onRefine,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all p-6 border border-gray-700"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Refine Diagram with AI</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <p className="text-gray-400 mb-4 text-sm">
          Describe the change you want to make to the current diagram.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-40 p-3 bg-gray-900 text-gray-200 font-mono resize-y rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-600"
          placeholder="e.g., Add a database and connect the web servers to it."
          disabled={isLoading}
        />
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onRefine}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-colors disabled:bg-sky-400 disabled:cursor-not-allowed flex items-center"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refining...
              </>
            ) : (
              'Refine'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefineAIModal;
