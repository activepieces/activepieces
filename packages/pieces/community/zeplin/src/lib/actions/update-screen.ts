import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ziplinAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { project_idProp, screen_idProp } from '../common/props';

export const updateScreen = createAction({
  auth: ziplinAuth,
  name: 'updateScreen',
  displayName: 'Update Screen',
  description: "Update a screen's description",
  audience: 'both',
  aiMetadata: { description: "Set the description of a specific Zeplin screen, identified by project ID and screen ID. Use to revise the textual description shown for a screen. Idempotent: repeating the call with the same description leaves the screen in the same state.", idempotent: true },
  props: {
    projectId: project_idProp,
    screenId: screen_idProp,
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new description for the screen',
      required: true,
    }),
  },
  async run(context) {
    const { projectId, screenId, description } = context.propsValue;

    const body: Record<string, unknown> = {
      description,
    };

    const response = await makeRequest<unknown>(
      context.auth.secret_text,
      HttpMethod.PATCH,
      `/projects/${projectId}/screens/${screenId}`,
      body
    );

    return response;
  },
});
