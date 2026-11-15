import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { projectOutputSchema } from '../output-schemas';

export const getProjectAction = createAction({
  auth: deepgramAuth,
  name: 'get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Gets the name and settings of a Deepgram project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Deepgram project by ID with its name and model-improvement opt-out setting. Leave the project empty when the key has a single project. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: projectOutputSchema,
  props: {
    project: deepgramProps.project(),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const projectId = await deepgramProjects.resolveProjectId({
      apiKey,
      project: context.propsValue.project,
    });
    return deepgramProjects.getProject({ apiKey, projectId });
  },
});
