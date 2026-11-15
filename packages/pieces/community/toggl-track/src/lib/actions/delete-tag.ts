import { createAction } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglOutputSchemas } from '../output-schemas';

export const deleteTag = createAction({
  auth: togglTrackAuth,
  name: 'delete_tag',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Tag',
  description: 'Permanently delete a tag from a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a tag by ID and removes it from every time entry. Returns { success, id }; a second call fails because it is already gone. Cannot be undone.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    tag_id: togglCommon.tag_id,
  },
  outputSchema: togglOutputSchemas.deleted,
  async run(context) {
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const tagId = togglApi.requireId({
      value: context.propsValue.tag_id,
      label: 'Tag',
    });
    await togglApi.withNotFound({
      label: `Tag ${tagId}`,
      run: () =>
        togglApi.request<unknown>({
          auth: context.auth,
          method: togglApi.HttpMethod.DELETE,
          path: `/workspaces/${workspaceId}/tags/${tagId}`,
        }),
    });
    return { success: true, id: tagId };
  },
});
