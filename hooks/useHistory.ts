
import { useState, useCallback } from 'react';

export const useHistory = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const setState = useCallback((newState: T, overwrite = false) => {
    setHistory(currentHistory => {
      const newHistory = overwrite ? currentHistory.slice(0, index + 1) : [...currentHistory];
      newHistory.splice(index + 1, overwrite ? 0 : newHistory.length, newState);
      return newHistory;
    });
    setIndex(prevIndex => prevIndex + 1);
  }, [index]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prevIndex => prevIndex - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prevIndex => prevIndex + 1);
    }
  }, [index, history.length]);

  return {
    state: history[index],
    setState,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
    history,
  };
};
