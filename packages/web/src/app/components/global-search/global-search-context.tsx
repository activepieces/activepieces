import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';

import { StyleSpotlight } from './style-spotlight';
import { useBrowseController } from './use-browse-controller';

type GlobalSearchContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return ctx;
}

function BrowsePanel({ onClose }: { onClose: () => void }) {
  const controller = useBrowseController({ onClose });

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">
        <StyleSpotlight controller={controller} />
      </div>
    </div>
  );
}

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { embedState } = useEmbedding();
  const { hideGlobalSearch } = embedState;

  useEffect(() => {
    if (hideGlobalSearch) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hideGlobalSearch]);

  return (
    <GlobalSearchContext.Provider value={{ open, setOpen }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export { BrowsePanel };
