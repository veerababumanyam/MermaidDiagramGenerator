
import React, { useState, useCallback, useRef } from 'react';
import type { IconSet } from '../types';

// FIX: Add `webkitdirectory` to React's HTML attribute types to allow for directory selection.
// This is a non-standard but widely supported attribute for folder uploads.
declare module 'react' {
    interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
        webkitdirectory?: string;
    }
}

interface UploadIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newIcons: Record<string, string>, vendor: string) => void;
  iconSets: Record<string, IconSet>;
}

interface UploadedFile {
  file: File;
  preview: string;
  vendor: string;
  shortcode: string;
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (file.type === 'image/svg+xml') {
        const svgText = result;
        const dataUri = `data:image/svg+xml;base64,${btoa(svgText)}`;
        resolve(dataUri);
      } else {
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 100;
          const MAX_HEIGHT = 100;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        }
        img.onerror = reject;
      }
    };
    reader.onerror = reject;

    if (file.type === 'image/svg+xml') {
        reader.readAsText(file);
    } else {
        reader.readAsDataURL(file);
    }
  });
};

const UploadIconModal: React.FC<UploadIconModalProps> = ({ isOpen, onClose, onSave, iconSets }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkVendor, setBulkVendor] = useState('custom');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    setIsLoading(true);
    const newUploadedFiles: UploadedFile[] = [];
    for (const file of Array.from(selectedFiles)) {
      if (!['image/svg+xml', 'image/jpeg', 'image/png'].includes(file.type)) {
        // Silently skip unsupported files when scanning a directory
        continue;
      }
      const preview = URL.createObjectURL(file);
      const shortcode = file.name
        .replace(/\.(svg|jpg|jpeg|png)$/i, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toUpperCase();
      newUploadedFiles.push({ file, preview, vendor: bulkVendor, shortcode });
    }
    setFiles(prev => [...prev, ...newUploadedFiles]);
    setIsLoading(false);
    // Reset input value to allow re-uploading the same file/folder
    event.target.value = '';
  };

  const handleVendorChange = (index: number, vendor: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, vendor } : f));
  };
  
  const handleShortcodeChange = (index: number, newShortcode: string) => {
    const sanitized = newShortcode.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase();
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, shortcode: sanitized } : f));
  };
  
  const handleBulkVendorChange = (vendor: string) => {
    setBulkVendor(vendor);
    setFiles(prev => prev.map(f => ({ ...f, vendor })));
  }

  const handleSave = async () => {
    setIsLoading(true);
    const iconsByVendor: Record<string, Record<string, string>> = {};

    for (const uploadedFile of files) {
      const { file, vendor, shortcode } = uploadedFile;
      if (!shortcode) {
          alert(`Icon "${file.name}" has an empty shortcode and cannot be saved.`);
          continue;
      }
      try {
        const dataUri = await fileToDataUri(file);
        
        if (!iconsByVendor[vendor]) {
          iconsByVendor[vendor] = {};
        }
        iconsByVendor[vendor][shortcode] = dataUri;
      } catch (err) {
        console.error(`Failed to process file ${file.name}:`, err);
        alert(`Could not process file: ${file.name}`);
      }
    }

    Object.entries(iconsByVendor).forEach(([vendor, icons]) => {
      onSave(icons, vendor);
    });

    setFiles([]);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const vendorOptions = [...Object.keys(iconSets).sort(), 'custom'];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl transform transition-all p-6 border border-gray-700 flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Upload Custom Icons</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2">
            <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-gray-300">1. Add icon files:</label>
                
                <input
                    type="file"
                    multiple
                    accept=".svg,.jpg,.jpeg,.png,image/svg+xml,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                    disabled={isLoading}
                />
                <input
                    type="file"
                    multiple
                    accept=".svg,.jpg,.jpeg,.png,image/svg+xml,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={directoryInputRef}
                    webkitdirectory="true"
                    disabled={isLoading}
                />

                <div className="flex gap-4">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors disabled:bg-cyan-400 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        Select Files
                    </button>
                    <button 
                        onClick={() => directoryInputRef.current?.click()}
                        className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition-colors disabled:bg-sky-400 disabled:cursor-not-allowed"
                        title="Select a folder to upload all SVG, JPG, and PNG files within it and its subfolders."
                    >
                        Select Folder
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Selecting a folder will scan for all supported image files within it, including subdirectories.</p>
              </div>
              {files.length > 0 && (
                <div>
                  <label htmlFor="bulk-vendor-select" className="block mb-2 text-sm font-medium text-gray-300">2. Assign all to vendor:</label>
                  <select
                        id="bulk-vendor-select"
                        value={bulkVendor}
                        onChange={(e) => handleBulkVendorChange(e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2"
                    >
                        {vendorOptions.map(v => (
                            <option key={v} value={v}>{iconSets[v]?.name || 'Custom'}</option>
                        ))}
                    </select>
                </div>
              )}
            </div>
            
            {files.length > 0 && (
            <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-2">3. Review and rename shortcodes if needed:</p>
                {files.map((uploadedFile, index) => (
                <div key={index} className="flex items-center gap-4 bg-gray-700 p-2 rounded-md">
                    <img src={uploadedFile.preview} alt={uploadedFile.file.name} className="w-12 h-12 bg-white p-1 rounded object-contain" />
                    <div className="flex-grow">
                        <label htmlFor={`shortcode-input-${index}`} className="sr-only">Icon Shortcode</label>
                        <input
                            id={`shortcode-input-${index}`}
                            type="text"
                            value={uploadedFile.shortcode}
                            onChange={(e) => handleShortcodeChange(index, e.target.value)}
                            className="w-full bg-gray-600 text-gray-200 font-mono text-sm p-1 rounded border border-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            title="Edit the icon shortcode (used as icon:SHORTCODE)"
                        />
                         <p className="text-xs text-gray-400 mt-1 truncate">{uploadedFile.file.name}</p>
                    </div>
                    <div>
                    <label htmlFor={`vendor-select-${index}`} className="sr-only">Vendor</label>
                    <select
                        id={`vendor-select-${index}`}
                        value={uploadedFile.vendor}
                        onChange={(e) => handleVendorChange(index, e.target.value)}
                        className="bg-gray-600 border border-gray-500 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2"
                    >
                        {vendorOptions.map(v => (
                            <option key={v} value={v}>{iconSets[v]?.name || 'Custom'}</option>
                        ))}
                    </select>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>

        <div className="mt-6 flex justify-end gap-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed flex items-center"
            disabled={isLoading || files.length === 0}
          >
            {isLoading ? 'Processing...' : `Save ${files.length} Icon(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadIconModal;
