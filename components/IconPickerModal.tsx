
import React, { useState, useMemo, useEffect } from 'react';
import type { IconSet } from '../types';
import { IconSearch } from './Icons';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconCode: string) => void;
  iconSets: Record<string, IconSet>;
}

const IconPickerModal: React.FC<IconPickerModalProps> = ({ isOpen, onClose, onSelect, iconSets }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [iconDataCache, setIconDataCache] = useState<Record<string, string>>({});

  const allIcons = useMemo(() => {
    const icons: { code: string; name: string; vendor: string; value: string }[] = [];
    for (const vendorKey in iconSets) {
      const set = iconSets[vendorKey];
      for (const iconCode in set.icons) {
        icons.push({
          code: iconCode,
          name: `${set.name} - ${iconCode.replace(/_/g, ' ')}`,
          vendor: vendorKey,
          value: set.icons[iconCode],
        });
      }
    }
    return icons.sort((a, b) => a.code.localeCompare(b.code));
  }, [iconSets]);

  const filteredIcons = useMemo(() => {
    return allIcons
      .filter(icon => vendorFilter === 'all' || icon.vendor === vendorFilter)
      .filter(icon => icon.code.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, vendorFilter, allIcons]);

  useEffect(() => {
    if (!isOpen) return;

    // Identify which of the currently visible icons are not yet in the cache.
    const iconsToLoad = filteredIcons.filter(icon => !iconDataCache[icon.code]);

    if (iconsToLoad.length > 0) {
      // This function fetches all needed icons in parallel.
      const fetchAndCacheIcons = async () => {
        const newCacheEntries: Record<string, string> = {};

        await Promise.all(
          iconsToLoad.map(async (icon) => {
            const { code, value, vendor } = icon;
            
            // Handle pre-embedded Data URIs (from user uploads)
            if (value.startsWith('data:image')) {
              newCacheEntries[code] = value;
              return;
            }

            // Fetch file-based icons
            const path = `/icons/${vendor.toLowerCase()}/${value}`;
            try {
              const response = await fetch(path);
              if (!response.ok) throw new Error(`Failed to fetch ${path}`);
              
              // Robust conversion for SVGs: fetch as text and convert to base64 Data URI.
              // This is more reliable than using blobs if the server sends an incorrect Content-Type.
              const svgText = await response.text();
              const dataUri = `data:image/svg+xml;base64,${btoa(svgText)}`;

              newCacheEntries[code] = dataUri;
            } catch (err) {
              console.error(err);
              newCacheEntries[code] = 'error'; // Mark as failed to prevent re-fetching
            }
          })
        );

        // Update the state once with all the new entries
        if (Object.keys(newCacheEntries).length > 0) {
          setIconDataCache(prevCache => ({ ...prevCache, ...newCacheEntries }));
        }
      };

      fetchAndCacheIcons();
    }
  }, [isOpen, filteredIcons, iconDataCache]);

  if (!isOpen) return null;
  
  const handleSelectIcon = (iconCode: string) => {
    onSelect(iconCode);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl transform transition-all p-6 border border-gray-700 flex flex-col"
        style={{ height: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Select an Icon</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>

        <div className="flex gap-4 mb-4 flex-shrink-0">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Search icons by code (e.g., AWS_EC2)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 pl-10"
            />
          </div>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2"
          >
            <option value="all">All Vendors</option>
            {Object.keys(iconSets).sort((a,b) => iconSets[a].name.localeCompare(iconSets[b].name)).map(key => (
              <option key={key} value={key}>{iconSets[key].name}</option>
            ))}
          </select>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredIcons.map(icon => {
              const iconData = iconDataCache[icon.code];
              const isLoaded = iconData && iconData !== 'error';
              
              return (
                <button
                  key={icon.code}
                  onClick={() => handleSelectIcon(icon.code)}
                  className="flex flex-col items-center justify-center p-2 bg-gray-700 rounded-lg hover:bg-cyan-600/50 hover:ring-2 hover:ring-cyan-400 transition-all aspect-square"
                  title={icon.name}
                  disabled={!isLoaded}
                >
                  {isLoaded ? (
                      <img src={iconData} alt={icon.code} className="w-10 h-10 object-contain bg-white rounded-md p-1" />
                  ) : (
                      <div className="w-10 h-10 bg-gray-600 rounded-md animate-pulse"></div>
                  )}
                  <span className="mt-2 text-xs text-center text-gray-300 truncate w-full">{icon.code}</span>
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-gray-400 mt-8">No icons found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconPickerModal;
