import {
  AppConnectionScope,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowUpRight,
  Cable,
  Crown,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { RowMenuItem } from '@/components/custom/list/row-menu';

function connectionActions({
  connection,
  globalLocked,
  handlers,
  withTest = true,
}: {
  connection: PlatformAppConnectionsListItem;
  globalLocked: boolean;
  handlers: ConnectionActionHandlers;
  withTest?: boolean;
}): RowMenuItem[] {
  const isGlobal = connection.scope === AppConnectionScope.PLATFORM;
  const locked = isGlobal && globalLocked;
  const ownProject = isGlobal ? undefined : connection.projects[0];
  const guarded = (run: () => void) => (locked ? handlers.upgrade : run);
  return [
    {
      label: t('Edit access'),
      icon: locked ? Crown : Pencil,
      hidden: !isGlobal,
      onSelect: guarded(() => handlers.edit(connection)),
    },
    {
      label:
        !locked && connection.projects.length === 0
          ? t('Reconnect (grant a project first)')
          : t('Reconnect'),
      icon: locked ? Crown : Cable,
      hidden: !isGlobal,
      disabled: !locked && connection.projects.length === 0,
      onSelect: guarded(() => handlers.reconnect(connection)),
    },
    {
      label: t('Test connection'),
      icon: RefreshCw,
      hidden: !withTest,
      onSelect: () => handlers.test(connection),
    },
    {
      label: t('Open project'),
      icon: ArrowUpRight,
      hidden: ownProject === undefined,
      onSelect: () => ownProject && handlers.openProject(ownProject.id),
    },
    {
      label: t('Delete'),
      icon: locked ? Crown : Trash2,
      destructive: !locked,
      onSelect: guarded(() => handlers.delete(connection)),
    },
  ];
}

export const connectionActionsUtils = { connectionActions };

export type ConnectionActionHandlers = {
  edit: (connection: PlatformAppConnectionsListItem) => void;
  reconnect: (connection: PlatformAppConnectionsListItem) => void;
  test: (connection: PlatformAppConnectionsListItem) => void;
  openProject: (projectId: string) => void;
  delete: (connection: PlatformAppConnectionsListItem) => void;
  upgrade: () => void;
};
