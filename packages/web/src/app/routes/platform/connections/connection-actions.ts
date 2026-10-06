import {
  AppConnectionScope,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import {
  ArrowUpRight01Icon,
  ConnectIcon,
  CrownIcon,
  Delete02Icon,
  PencilEdit01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { RowMenuItem } from '@/components/custom/list/row-menu';
import { AdminControl } from '@/lib/admin-control';

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
      icon: locked ? CrownIcon : PencilEdit01Icon,
      hidden: !isGlobal,
      control: locked
        ? undefined
        : AdminControl.CONNECTIONS_CONNECTION_EDIT_OPEN,
      onSelect: guarded(() => handlers.edit(connection)),
    },
    {
      label:
        !locked && connection.projects.length === 0
          ? t('Reconnect (grant a project first)')
          : t('Reconnect'),
      icon: locked ? CrownIcon : ConnectIcon,
      hidden: !isGlobal,
      disabled: !locked && connection.projects.length === 0,
      control: locked
        ? undefined
        : AdminControl.CONNECTIONS_CONNECTION_RECONNECT_OPEN,
      onSelect: guarded(() => handlers.reconnect(connection)),
    },
    {
      label: t('Test connection'),
      icon: RefreshIcon,
      hidden: !withTest,
      control: AdminControl.CONNECTIONS_CONNECTION_TEST_RUN,
      onSelect: () => handlers.test(connection),
    },
    {
      label: t('Open project'),
      icon: ArrowUpRight01Icon,
      hidden: ownProject === undefined,
      onSelect: () => ownProject && handlers.openProject(ownProject.id),
    },
    {
      label: t('Delete'),
      icon: locked ? CrownIcon : Delete02Icon,
      destructive: !locked,
      control: locked
        ? undefined
        : AdminControl.CONNECTIONS_CONNECTION_DELETE_OPEN,
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
