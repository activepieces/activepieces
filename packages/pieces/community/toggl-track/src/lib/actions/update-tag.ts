import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTag } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const updateTag = createAction({
  auth: togglTrackAuth,
  name: 'update_tag',
  classification: 'WRITE',
  displayName: 'Update Tag',
  description: 'Rename a tag.',
  audience: 'both',
  aiMetadata: {
    description:
      'Renames a tag by ID; time entries keep the tag under its new name. Returns the updated tag. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    tag_id: togglCommon.tag_id,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new name of the tag.',
      required: true,
    }),
  },
  outputSchema: togglOutputSchemas.tag,
  async run(context) {
    const { name } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const tagId = togglApi.requireId({
      value: context.propsValue.tag_id,
      label: 'Tag',
    });
    const path = `/workspaces/${workspaceId}/tags/${tagId}`;

    return togglApi.withNotFound({
      label: `Tag ${tagId}`,
      run: async () => {
        if (togglApi.isTwo(auth)) {
          const current = await togglApi.request<TwoTag>({
            auth,
            method: togglApi.HttpMethod.GET,
            path,
          });
          const updated = await togglApi.request<TwoTag>({
            auth,
            method: togglApi.HttpMethod.PUT,
            path,
            body: { name, color: current.color ?? null },
          });
          return togglModels.tag(updated);
        }
        const updated = await togglApi.request<
          Record<string, unknown> | Record<string, unknown>[]
        >({
          auth,
          method: togglApi.HttpMethod.PUT,
          path,
          body: { name },
        });
        return Array.isArray(updated) ? updated[0] ?? null : updated;
      },
    });
  },
});
