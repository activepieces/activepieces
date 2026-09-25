import { Permission } from '@activepieces/core-utils';
import { DefaultProjectRole, rolePermissions } from '@activepieces/shared';
import { t } from 'i18next';

function groups(): PermissionGroup[] {
  return [
    {
      key: 'build',
      label: t('Build'),
      rows: [
        {
          key: 'flows',
          label: t('Flows'),
          view: Permission.READ_FLOW,
          edit: Permission.WRITE_FLOW,
          viewAlwaysOn: true,
        },
        {
          key: 'flow-status',
          label: t('Flow status'),
          edit: Permission.UPDATE_FLOW_STATUS,
        },
        {
          key: 'folders',
          label: t('Folders'),
          view: Permission.READ_FOLDER,
          edit: Permission.WRITE_FOLDER,
        },
        {
          key: 'tables',
          label: t('Tables'),
          view: Permission.READ_TABLE,
          edit: Permission.WRITE_TABLE,
        },
        {
          key: 'agents',
          label: t('Agents'),
          view: Permission.READ_AGENT,
          edit: Permission.WRITE_AGENT,
        },
        {
          key: 'knowledge-base',
          label: t('Knowledge base'),
          view: Permission.READ_KNOWLEDGE_BASE,
          edit: Permission.WRITE_KNOWLEDGE_BASE,
        },
        {
          key: 'variables',
          label: t('Variables'),
          view: Permission.READ_VARIABLE,
          edit: Permission.WRITE_VARIABLE,
        },
        {
          key: 'mcp-servers',
          label: t('MCP servers'),
          view: Permission.READ_MCP,
          edit: Permission.WRITE_MCP,
        },
      ],
    },
    {
      key: 'run',
      label: t('Run'),
      rows: [
        {
          key: 'runs',
          label: t('Runs'),
          view: Permission.READ_RUN,
          edit: Permission.WRITE_RUN,
        },
        {
          key: 'alerts',
          label: t('Alerts'),
          view: Permission.READ_ALERT,
          edit: Permission.WRITE_ALERT,
        },
      ],
    },
    {
      key: 'connections-releases',
      label: t('Connections & releases'),
      rows: [
        {
          key: 'app-connections',
          label: t('App connections'),
          view: Permission.READ_APP_CONNECTION,
          edit: Permission.WRITE_APP_CONNECTION,
        },
        {
          key: 'project-releases',
          label: t('Project releases'),
          view: Permission.READ_PROJECT_RELEASE,
          edit: Permission.WRITE_PROJECT_RELEASE,
        },
      ],
    },
    {
      key: 'people',
      label: t('People'),
      rows: [
        {
          key: 'project-members',
          label: t('Project members'),
          view: Permission.READ_PROJECT_MEMBER,
          edit: Permission.WRITE_PROJECT_MEMBER,
        },
        {
          key: 'invitations',
          label: t('Invitations'),
          view: Permission.READ_INVITATION,
          edit: Permission.WRITE_INVITATION,
        },
      ],
    },
    {
      key: 'project',
      label: t('Project'),
      rows: [
        {
          key: 'project-settings',
          label: t('Project settings'),
          view: Permission.READ_PROJECT,
          edit: Permission.WRITE_PROJECT,
          viewAlwaysOn: true,
        },
      ],
    },
  ];
}

function allRows(): PermissionRow[] {
  return groups().flatMap((group) => group.rows);
}

function totalBoxes(): number {
  return allRows().reduce(
    (total, row) => total + (row.view ? 1 : 0) + (row.edit ? 1 : 0),
    0,
  );
}

function grantedBoxes({ permissions }: { permissions: string[] }): number {
  const granted = new Set(permissions);
  return allRows().reduce((total, row) => {
    const viewGranted = row.view && granted.has(row.view) ? 1 : 0;
    const editGranted = row.edit && granted.has(row.edit) ? 1 : 0;
    return total + viewGranted + editGranted;
  }, 0);
}

function alwaysOnPermissions(): string[] {
  return allRows().flatMap((row) =>
    row.viewAlwaysOn && row.view ? [row.view] : [],
  );
}

function basePermissions({ base }: { base: RoleBase }): string[] {
  switch (base) {
    case 'Viewer':
      return [...rolePermissions[DefaultProjectRole.VIEWER]];
    case 'Editor':
      return [...rolePermissions[DefaultProjectRole.EDITOR]];
    default:
      return alwaysOnPermissions();
  }
}

function toggleBox({
  permissions,
  row,
  column,
  checked,
}: ToggleBoxParams): string[] {
  const next = new Set(permissions);
  if (column === 'edit' && row.edit) {
    if (checked) {
      next.add(row.edit);
      if (row.view) {
        next.add(row.view);
      }
    } else {
      next.delete(row.edit);
    }
  }
  if (column === 'view' && row.view && !row.viewAlwaysOn) {
    if (checked) {
      next.add(row.view);
    } else {
      next.delete(row.view);
      if (row.edit) {
        next.delete(row.edit);
      }
    }
  }
  return Array.from(next);
}

function changedRowKeys({
  permissions,
  base,
}: {
  permissions: string[];
  base: RoleBase;
}): string[] {
  const current = new Set(permissions);
  const original = new Set(basePermissions({ base }));
  return allRows()
    .filter((row) =>
      [row.view, row.edit].some(
        (permission) =>
          permission && current.has(permission) !== original.has(permission),
      ),
    )
    .map((row) => row.key);
}

export const rolePermissionModel = {
  groups,
  totalBoxes,
  grantedBoxes,
  basePermissions,
  toggleBox,
  changedRowKeys,
};

export const ROLE_BASES: RoleBase[] = ['Nothing', 'Viewer', 'Editor'];

export type RoleBase = 'Nothing' | 'Viewer' | 'Editor';

export type PermissionColumn = 'view' | 'edit';

export type PermissionRow = {
  key: string;
  label: string;
  view?: Permission;
  edit?: Permission;
  viewAlwaysOn?: boolean;
};

export type PermissionGroup = {
  key: string;
  label: string;
  rows: PermissionRow[];
};

type ToggleBoxParams = {
  permissions: string[];
  row: PermissionRow;
  column: PermissionColumn;
  checked: boolean;
};
