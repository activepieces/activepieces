import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { InviteUserDialog } from '@/features/members';
import { getProjectName } from '@/features/projects';

import { ProjectSettingsDialog } from '../project-settings';

import { ProjectActions } from './browse-style-shared';
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

      {controller.category === 'project' &&
        controller.projectActions.length > 0 && (
          <div className="flex items-center gap-0.5 border-t border-foreground/[0.06] px-2 py-1.5">
            <ProjectActions controller={controller} />
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

      <ProjectSettingsDialog
        open={controller.settingsOpen}
        onClose={() => controller.setSettingsOpen(false)}
      />
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
