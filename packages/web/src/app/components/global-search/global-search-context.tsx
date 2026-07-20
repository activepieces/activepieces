import { t } from 'i18next';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import { StyleSpotlight } from './style-spotlight';
import { useBrowseController } from './use-browse-controller';

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

// The Browse popup: a centered spotlight dialog over a blurred backdrop,
// opened from the sidebar search button or Ctrl/Cmd+K.
function BrowseDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-background/50 backdrop-blur-sm"
        className="top-[18%] flex h-[min(480px,70vh)] w-[min(560px,calc(100vw-2rem))] max-w-none translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-foreground/[0.08] bg-popover/85 p-0 shadow-2xl backdrop-blur-2xl data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
        onInteractOutside={(e) => {
          // Keep the dialog open when interacting with nested overlays it
          // spawns (create/rename/move/delete dialogs, dropdown menus, toasts).
          const node = e.detail.originalEvent.target;
          if (
            node instanceof Element &&
            node.closest(
              '[data-radix-popper-content-wrapper],[role="dialog"],[role="alertdialog"],[data-sonner-toaster]',
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">{t('Search')}</DialogTitle>
        <BrowsePanel onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
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
      {!hideGlobalSearch && <BrowseDialog open={open} setOpen={setOpen} />}
    </GlobalSearchContext.Provider>
  );
}

type GlobalSearchContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};
