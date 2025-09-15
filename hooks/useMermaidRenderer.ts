
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { IconSet } from '../types';

// Declare mermaid for TypeScript
declare const mermaid: any;
import { PROFESSIONAL_THEMES } from '../constants';

const fetchIconDataUris = async (
  iconNames: string[],
  iconSetKey: string,
  allIconSets: Record<string, IconSet>
): Promise<Record<string, string>> => {
  const newCacheEntries: Record<string, string> = {};
  const selectedIconSet = allIconSets[iconSetKey];

  await Promise.all(
    iconNames.map(async (name) => {
      const filename = selectedIconSet?.icons[name];
      if (!filename) return;

      const path = `/icons/${iconSetKey.toLowerCase()}/${filename}`;
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP error ${response.status} for ${path}`);
        
        const svgText = await response.text();
        const dataUri = `data:image/svg+xml;base64,${btoa(svgText)}`;
        
        newCacheEntries[name] = dataUri;
      } catch (err) {
        console.error(`Failed to fetch and process icon "${name}" from ${path}:`, err);
      }
    })
  );

  return newCacheEntries;
};


export const useMermaidRenderer = () => {
  const { code, theme, fontFamily, iconSet, allIconSets, setSvg, setError } = useAppStore();
  const [iconCache, setIconCache] = useState<Record<string, string>>({});

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvg('');
        setError(null);
        return;
      }
  
      const selectedIconSet = allIconSets[iconSet];
      const iconRegex = /icon:(\w+)/g;
      const requiredIcons = [...new Set(Array.from(code.matchAll(iconRegex), (match) => match[1]))];
      const missingIcons = requiredIcons.filter((name) => !iconCache[name] && selectedIconSet?.icons[name]);
  
      if (missingIcons.length > 0 && selectedIconSet) {
        const dataUriIcons = missingIcons.filter((name) => selectedIconSet.icons[name]?.startsWith('data:image'));
        const newCacheEntries: Record<string, string> = {};
        dataUriIcons.forEach(name => {
            newCacheEntries[name] = selectedIconSet.icons[name];
        });

        const iconsToFetch = missingIcons.filter((name) => !selectedIconSet.icons[name]?.startsWith('data:image'));
        if (iconsToFetch.length > 0) {
            try {
                const fetchedEntries = await fetchIconDataUris(iconsToFetch, iconSet, allIconSets);
                Object.assign(newCacheEntries, fetchedEntries);
            } catch (err) {
                console.error("Error fetching icons:", err);
                setError("Could not load one or more diagram icons.");
            }
        }

        if (Object.keys(newCacheEntries).length > 0) {
            setIconCache((prev) => ({ ...prev, ...newCacheEntries }));
        }
        return;
      }
  
      try {
        const processedCode = code.replace(iconRegex, (match, iconName) => {
          if (iconCache[iconName]) {
            return `<img src="${iconCache[iconName]}" width="40" height="40" /><br/>`;
          }
          return match;
        });
  
        mermaid.initialize({
          startOnLoad: false,
          theme: PROFESSIONAL_THEMES[theme] ? 'default' : theme,
          securityLevel: 'loose',
          fontFamily: fontFamily,
          themeVariables: PROFESSIONAL_THEMES[theme] || {},
        });
  
        const { svg: renderedSvg } = await mermaid.render('graphDiv', processedCode);
        setSvg(renderedSvg);
        setError(null);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred during rendering.');
        }
        setSvg('');
      }
    };
  
    renderDiagram();
  }, [code, theme, fontFamily, iconSet, allIconSets, setSvg, setError]);

  // Effect to invalidate cache when icon sets change (e.g., user upload)
  useEffect(() => {
    setIconCache({});
  }, [allIconSets, iconSet]);
};
