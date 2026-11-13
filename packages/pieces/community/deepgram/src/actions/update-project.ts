import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../common/client';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { updateProjectOutputSchema } from '../output-schemas';

export const updateProjectAction = createAction({
  auth: deepgramAuth,
  name: 'update_project',
  classification: 'WRITE',
  displayName: 'Rename Project',
  description: 'Changes the name of a Deepgram project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Renames a Deepgram project and returns the project as stored afterwards. Only the name changes. Setting the same name again changes nothing, so it is idempotent. May require an owner API key, since changing project settings is owner-only.',
    idempotent: true,
  },
  outputSchema: updateProjectOutputSchema,
  props: {
    project: deepgramProps.project(),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new name of the project.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const name = (context.propsValue.name ?? '').trim();
    if (name.length === 0) {
      throw new Error('Enter a new name for the project.');
    }
    const projectId = await deepgramProjects.resolveProjectId({
      apiKey,
      project: context.propsValue.project,
    });
    const response = await deepgramClient.request<{ message?: string }>({
      apiKey,
      method: HttpMethod.PATCH,
      path: deepgramProjects.projectPath({ projectId }),
      body: { name },
      timeoutMs: DEEPGRAM_TIMEOUTS.manage,
      operation: 'rename the project',
    });
    const project = await deepgramProjects.getProject({ apiKey, projectId });
    return {
      ...project,
      message: response.body?.message ?? null,
    };
  },
});
