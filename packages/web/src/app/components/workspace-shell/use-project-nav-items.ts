import { Permission } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ComponentType } from 'react';

import { BoxIcon } from '@/components/icons/box';
import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { VariableIcon } from '@/components/icons/variable';
import { WorkflowIcon } from '@/components/icons/workflow';
import { useEmbedding } from '@/components/providers/embed-provider';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { StageResource } from './stage-context';

// The project's second-level pages (Automations / Runs / Connections / Variables /
// Releases), gated by permissions/flags/embed. Feeds the Stage breadcrumb's section
// switcher. Tables live inside the Automations page (their route redirects there), so
// they are not a separate entry.
export function useProjectNavItems(): ProjectNavItem[] {
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();
  const { project } = projectCollectionUtils.useCurrentProject();

  const items: ProjectNavItem[] = [
    {
      key: 'automations',
      label: t('Automations'),
      Icon: WorkflowIcon,
      resource: { type: 'automations' },
      show: checkAccess(Permission.READ_FLOW),
    },
    {
      key: 'runs',
      label: t('Runs'),
      Icon: HistoryIcon,
      resource: { type: 'runs' },
      show: checkAccess(Permission.READ_RUN),
    },
    {
      key: 'connections',
      label: t('Connections'),
      Icon: ConnectIcon,
      resource: { type: 'connections' },
      show: checkAccess(Permission.READ_APP_CONNECTION),
    },
    {
      key: 'variables',
      label: t('Variables'),
      Icon: VariableIcon,
      resource: { type: 'variables' },
      show: checkAccess(Permission.READ_VARIABLE),
    },
    {
      key: 'releases',
      label: t('Releases'),
      Icon: BoxIcon,
      resource: { type: 'releases' },
      show:
        project.releasesEnabled &&
        checkAccess(Permission.READ_PROJECT_RELEASE) &&
        !embedState.isEmbedded,
    },
  ];

  return items.filter((item) => item.show);
}

export type ProjectNavItem = {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
  resource: StageResource;
  show: boolean;
};
