import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglOutputSchemas } from '../output-schemas';

export const deleteGroup = createAction({
  auth: togglTrackAuth,
  name: 'delete_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Group',
  description: 'Delete a group (team) from an organization.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a group by ID; members stay in the organization. Returns { success, id }; a second call fails because it is already gone. Cannot be undone.',
    idempotent: false,
  },
  props: {
    organization_id: togglCommon.organization_id,
    workspace_id: togglCommon.workspace_id,
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'The ID of the group to delete (group_id from Create Group).',
      required: true,
    }),
  },
  outputSchema: togglOutputSchemas.deleted,
  async run(context) {
    const auth = context.auth;
    const groupId = togglApi.requireId({
      value: context.propsValue.group_id,
      label: 'Group ID',
    });
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const organizationId = togglApi.isTwo(auth)
      ? togglApi.twoOrganizationId(auth)
      : togglApi.requireId({
          value: context.propsValue.organization_id,
          label: 'Organization',
        });
    await togglApi.withNotFound({
      label: `Group ${groupId}`,
      run: () =>
        togglApi.request<unknown>({
          auth,
          method: togglApi.HttpMethod.DELETE,
          path: `/organizations/${organizationId}/groups/${groupId}`,
          queryParams: togglApi.isTwo(auth)
            ? { workspace_id: String(workspaceId) }
            : undefined,
        }),
    });
    return { success: true, id: groupId };
  },
});
