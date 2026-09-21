import { Permission } from '@activepieces/core-utils';
import { DefaultProjectRole, rolePermissions } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import {
  PermissionRow,
  rolePermissionModel,
} from '@/app/routes/platform/security/project-role/role-permissions';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const rows = (): PermissionRow[] =>
  rolePermissionModel.groups().flatMap((group) => group.rows);

const row = (key: string): PermissionRow => {
  const found = rows().find((candidate) => candidate.key === key);
  if (!found) {
    throw new Error(`no row for ${key}`);
  }
  return found;
};

const EXPECTED_MAPPING: [string, Permission | undefined, Permission | undefined][] =
  [
    ['flows', Permission.READ_FLOW, Permission.WRITE_FLOW],
    ['flow-status', undefined, Permission.UPDATE_FLOW_STATUS],
    ['folders', Permission.READ_FOLDER, Permission.WRITE_FOLDER],
    ['tables', Permission.READ_TABLE, Permission.WRITE_TABLE],
    ['agents', Permission.READ_AGENT, Permission.WRITE_AGENT],
    [
      'knowledge-base',
      Permission.READ_KNOWLEDGE_BASE,
      Permission.WRITE_KNOWLEDGE_BASE,
    ],
    ['variables', Permission.READ_VARIABLE, Permission.WRITE_VARIABLE],
    ['mcp-servers', Permission.READ_MCP, Permission.WRITE_MCP],
    ['runs', Permission.READ_RUN, Permission.WRITE_RUN],
    ['alerts', Permission.READ_ALERT, Permission.WRITE_ALERT],
    [
      'app-connections',
      Permission.READ_APP_CONNECTION,
      Permission.WRITE_APP_CONNECTION,
    ],
    [
      'project-releases',
      Permission.READ_PROJECT_RELEASE,
      Permission.WRITE_PROJECT_RELEASE,
    ],
    [
      'project-members',
      Permission.READ_PROJECT_MEMBER,
      Permission.WRITE_PROJECT_MEMBER,
    ],
    ['invitations', Permission.READ_INVITATION, Permission.WRITE_INVITATION],
    ['project-settings', Permission.READ_PROJECT, Permission.WRITE_PROJECT],
  ];

describe('the permission grid mapping', () => {
  it.each(EXPECTED_MAPPING)(
    '%s maps to the right view and edit permissions',
    (key, view, edit) => {
      expect(row(key).view).toBe(view);
      expect(row(key).edit).toBe(edit);
    },
  );

  it('lists every row exactly once, in the expected order', () => {
    expect(rows().map((candidate) => candidate.key)).toEqual(
      EXPECTED_MAPPING.map(([key]) => key),
    );
  });

  it('covers every Permission except the one deliberately left out', () => {
    const inGrid = new Set(
      rows().flatMap((candidate) =>
        [candidate.view, candidate.edit].filter(Boolean),
      ),
    );
    const missing = Object.values(Permission).filter(
      (permission) => !inGrid.has(permission),
    );
    expect(missing).toEqual([Permission.PUBLISH_SENSITIVE_FLOW_ACCESS]);
  });

  it('has 29 boxes, which is what the counter promises', () => {
    expect(rolePermissionModel.totalBoxes()).toBe(29);
  });

  it('keeps view permanently on only where a role cannot function without it', () => {
    expect(
      rows()
        .filter((candidate) => candidate.viewAlwaysOn)
        .map((candidate) => candidate.key),
    ).toEqual(['flows', 'project-settings']);
  });
});

describe('the built-in bases', () => {
  it.each([
    ['Nothing' as const, [Permission.READ_FLOW, Permission.READ_PROJECT], 2],
    ['Viewer' as const, rolePermissions[DefaultProjectRole.VIEWER], 12],
    ['Editor' as const, rolePermissions[DefaultProjectRole.EDITOR], 24],
  ])('%s seeds the stored set and counts %i', (base, expected, count) => {
    const permissions = rolePermissionModel.basePermissions({ base });
    expect(new Set(permissions)).toEqual(new Set(expected));
    expect(rolePermissionModel.grantedBoxes({ permissions })).toBe(count);
  });

  it('never counts a permission the grid does not show', () => {
    const adminBoxes = rolePermissionModel.grantedBoxes({
      permissions: rolePermissions[DefaultProjectRole.ADMIN],
    });
    expect(rolePermissions[DefaultProjectRole.ADMIN]).toContain(
      Permission.PUBLISH_SENSITIVE_FLOW_ACCESS,
    );
    expect(adminBoxes).toBe(rolePermissionModel.totalBoxes());
  });
});

describe('toggling a box', () => {
  it('turns view on with edit, because write without read is not a state the API has', () => {
    const permissions = rolePermissionModel.toggleBox({
      permissions: [],
      row: row('tables'),
      column: 'edit',
      checked: true,
    });
    expect(new Set(permissions)).toEqual(
      new Set([Permission.READ_TABLE, Permission.WRITE_TABLE]),
    );
  });

  it('clears edit when view goes off', () => {
    const permissions = rolePermissionModel.toggleBox({
      permissions: [Permission.READ_TABLE, Permission.WRITE_TABLE],
      row: row('tables'),
      column: 'view',
      checked: false,
    });
    expect(permissions).toEqual([]);
  });

  it('leaves edit alone when only edit goes off', () => {
    const permissions = rolePermissionModel.toggleBox({
      permissions: [Permission.READ_TABLE, Permission.WRITE_TABLE],
      row: row('tables'),
      column: 'edit',
      checked: false,
    });
    expect(permissions).toEqual([Permission.READ_TABLE]);
  });

  it('refuses to take away a view that is always on', () => {
    const permissions = rolePermissionModel.toggleBox({
      permissions: [Permission.READ_FLOW],
      row: row('flows'),
      column: 'view',
      checked: false,
    });
    expect(permissions).toEqual([Permission.READ_FLOW]);
  });

  it('ignores a view toggle on a row that has no view box', () => {
    const permissions = rolePermissionModel.toggleBox({
      permissions: [],
      row: row('flow-status'),
      column: 'view',
      checked: true,
    });
    expect(permissions).toEqual([]);
  });

  it('reaches exactly the three states the old None/Read/Write control offered', () => {
    const tables = row('tables');
    const none = rolePermissionModel.toggleBox({
      permissions: [Permission.READ_TABLE, Permission.WRITE_TABLE],
      row: tables,
      column: 'view',
      checked: false,
    });
    const read = rolePermissionModel.toggleBox({
      permissions: none,
      row: tables,
      column: 'view',
      checked: true,
    });
    const write = rolePermissionModel.toggleBox({
      permissions: read,
      row: tables,
      column: 'edit',
      checked: true,
    });
    expect([new Set(none), new Set(read), new Set(write)]).toEqual([
      new Set([]),
      new Set([Permission.READ_TABLE]),
      new Set([Permission.READ_TABLE, Permission.WRITE_TABLE]),
    ]);
  });
});

describe('marking what changed against a base', () => {
  it('finds nothing when the set is the base', () => {
    expect(
      rolePermissionModel.changedRowKeys({
        permissions: rolePermissionModel.basePermissions({ base: 'Viewer' }),
        base: 'Viewer',
      }),
    ).toEqual([]);
  });

  it('names the rows that differ, added or taken away', () => {
    const viewer = rolePermissionModel.basePermissions({ base: 'Viewer' });
    const withAlerts = rolePermissionModel.toggleBox({
      permissions: viewer,
      row: row('alerts'),
      column: 'view',
      checked: true,
    });
    const withoutTables = rolePermissionModel.toggleBox({
      permissions: withAlerts,
      row: row('tables'),
      column: 'view',
      checked: false,
    });
    expect(
      rolePermissionModel.changedRowKeys({
        permissions: withoutTables,
        base: 'Viewer',
      }),
    ).toEqual(['tables', 'alerts']);
  });
});
