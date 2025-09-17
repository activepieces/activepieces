// Custom
import { t } from 'i18next';
import { Settings } from 'lucide-react';
import { useState } from 'react';

import { useEmbedding } from '@/components/embed-provider';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import { ProjectSettingsDialog } from '../project-settings';
import { projectHooks } from '@/hooks/project-hooks';

export function SidebarProjectSettingsButton() {
  const { embedState } = useEmbedding();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { project } = projectHooks.useCurrentProject();

  if (embedState.isEmbedded) {
    return null;
  }

  return (
    <div className={`w-full flex items-center gap-2 px-2 py-1.5`}>
      <SidebarMenuButton onClick={() => setSettingsOpen(true)}>
        <Settings className="size-4" />
        {t('Project Settings')}
      </SidebarMenuButton>
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={project?.id}
        initialValues={{
          projectName: project?.displayName,
          tasks: project?.plan?.tasks?.toString() ?? '',
          aiCredits: project?.plan?.aiCredits?.toString() ?? '',
        }}
      />
    </div>
  );
}
