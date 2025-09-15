
import React from 'react';

interface TextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  setText: (text: string) => void;
  onSave: () => void;
}

const TextEditorModal: React.FC<TextEditorModalProps> = ({ isOpen, onClose, text, setText, onSave }) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all p-6 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Edit Node Text</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 p-3 bg-gray-900 text-gray-200 font-mono resize-y rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-600"
          placeholder="Enter node text..."
        />
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextEditorModal;