import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { InviteUserDialog } from '@/features/members';
import { getProjectName } from '@/features/projects';
import { cn } from '@/lib/utils';

import { ProjectActions } from './browse-style-shared';
import { StyleFocus } from './style-focus';
import { StyleSections } from './style-sections';
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

// Temporary design-exploration: 3 elegant Spotlight styles flippable in-place.
// The rotator chrome only renders in DEV; production shows STYLES[0] with no
// arrows. Collapse to the chosen style once a direction is picked.
const STYLES = [
  { name: 'Pure Spotlight', Component: StyleSpotlight },
  { name: 'Grouped Sections', Component: StyleSections },
  { name: 'Airy Focus', Component: StyleFocus },
];

function BrowsePanel({ onClose }: { onClose: () => void }) {
  const controller = useBrowseController({ onClose });
  const [styleIndex, setStyleIndex] = useState(0);
  const Active = STYLES[styleIndex].Component;

  const rotate = (delta: number) =>
    setStyleIndex((i) => (i + delta + STYLES.length) % STYLES.length);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">
        <Active controller={controller} />
      </div>

      {controller.category === 'project' &&
        controller.projectActions.length > 0 && (
          <div className="flex items-center gap-0.5 border-t border-foreground/[0.06] px-2 py-1.5">
            <ProjectActions controller={controller} />
          </div>
        )}

      {import.meta.env.DEV && (
        <div className="flex items-center justify-center gap-3 border-t px-3 py-2">
          <button
            type="button"
            aria-label="Previous style"
            onClick={() => rotate(-1)}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground/80">
              {STYLES[styleIndex].name}
            </span>
            <span className="flex items-center gap-1">
              {STYLES.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  aria-label={s.name}
                  onClick={() => setStyleIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === styleIndex
                      ? 'w-4 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60',
                  )}
                />
              ))}
            </span>
          </div>
          <button
            type="button"
            aria-label="Next style"
            onClick={() => rotate(1)}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {controller.canInvite && controller.currentProject && (
        <InviteUserDialog
          open={controller.inviteOpen}
          setOpen={controller.setInviteOpen}
          scope={{
            kind: 'project',
            projectId: controller.currentProject.id,
            projectName: getProjectName(controller.currentProject),
          }}
        />
      )}
    </div>
  );
}

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ open, setOpen }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export { BrowsePanel };
