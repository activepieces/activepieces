import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglOutputSchemas } from '../output-schemas';

export const createGroup = createAction({
  auth: togglTrackAuth,
  name: 'create_group',
  classification: 'WRITE',
  displayName: 'Create Group',
  description: 'Create a group (team) in an organization.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a group (team) in the organization with optional members. Returns { group_id, name, workspace_ids, user_ids }. A retry creates a duplicate.',
    idempotent: false,
  },
  props: {
    organization_id: togglCommon.organization_id,
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Group Name',
      required: true,
    }),
    user_ids: Property.ShortText({
      displayName: 'Member Organization User IDs',
      description:
        'Comma-separated IDs from List Organization Users.',
      required: false,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description: 'Group emoji. Toggl 2.0 only.',
      required: false,
      defaultValue: '👥',
    }),
  },
  outputSchema: togglOutputSchemas.group,
  async run(context) {
    const auth = context.auth;
    const name = context.propsValue.name.trim();
    if (!name) {
      throw new Error('Group Name is required.');
    }
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const userIds = (context.propsValue.user_ids ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) =>
        togglApi.requireId({ value: part, label: 'Member Organization User IDs' })
      );

    if (togglApi.isTwo(auth)) {
      const group = await togglApi.request<TwoGroup>({
        auth,
        method: togglApi.HttpMethod.POST,
        path: `/organizations/${togglApi.twoOrganizationId(auth)}/groups`,
        body: {
          name,
          emoji: context.propsValue.emoji?.trim() || '👥',
          organization_users: userIds,
          workspaces: [workspaceId],
        },
      });
      return {
        group_id: group.id,
        name: group.name,
        workspace_ids: idsOf({ items: group.workspaces, key: 'workspace_id' }),
        user_ids: idsOf({ items: group.users, key: 'organization_user_id' }),
        at: group.updated_at ?? group.created_at ?? null,
      };
    }

    const organizationId = togglApi.requireId({
      value: context.propsValue.organization_id,
      label: 'Organization',
    });
    const group = await togglApi.request<ClassicGroup>({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/organizations/${organizationId}/groups`,
      body: { name, users: userIds, workspaces: [workspaceId] },
    });
    return {
      group_id: group.group_id,
      name: group.name,
      workspace_ids: idsOf({ items: group.workspaces, key: 'workspace_id' }),
      user_ids: idsOf({ items: group.users, key: 'user_id' }),
      at: group.at ?? null,
    };
  },
});

function idsOf({
  items,
  key,
}: {
  items: unknown[] | null | undefined;
  key: string;
}): number[] {
  return (items ?? [])
    .map((item) => {
      if (typeof item === 'number') {
        return item;
      }
      if (typeof item === 'object' && item !== null && key in item) {
        const value: unknown = Object.entries(item).find(([k]) => k === key)?.[1];
        return typeof value === 'number' ? value : null;
      }
      return null;
    })
    .filter((id): id is number => id !== null);
}

type ClassicGroup = {
  group_id: number;
  name: string;
  workspaces?: unknown[] | null;
  users?: unknown[] | null;
  at?: string;
};

type TwoGroup = {
  id: number;
  name: string;
  workspaces?: unknown[] | null;
  users?: unknown[] | null;
  created_at?: string;
  updated_at?: string;
};
