import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTag } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const createTag = createAction({
  auth: togglTrackAuth,
  name: 'create_tag',
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Create a new tag in the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a tag in a workspace. Needs the workspace and a name. Returns the new tag. A retry creates a duplicate.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the new tag.',
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

    if (togglApi.isTwo(auth)) {
      const created = await togglApi.request<TwoTag>({
        auth,
        method: togglApi.HttpMethod.POST,
        path: `/workspaces/${workspaceId}/tags`,
        body: { name },
      });
      return togglModels.tag(created);
    }

    const created = await togglApi.request<
      Record<string, unknown> | Record<string, unknown>[]
    >({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/workspaces/${workspaceId}/tags`,
      body: { name },
    });
    return Array.isArray(created) ? created[0] ?? null : created;
  },
});
