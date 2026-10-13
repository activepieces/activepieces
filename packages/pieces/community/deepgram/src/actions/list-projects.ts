import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { deepgramProjects } from '../common/projects';
import { listProjectsOutputSchema } from '../output-schemas';

export const listProjectsAction = createAction({
  auth: deepgramAuth,
  name: 'list_projects',
  classification: 'SEARCH',
  displayName: 'List Projects',
  description: 'Lists the Deepgram projects this API key can access.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches all Deepgram projects accessible to the authenticated API key, with no inputs or filters. Use it to discover project IDs before project-scoped operations or to verify account access. Read-only and safe to call repeatedly.',
    idempotent: true,
  },
  outputSchema: listProjectsOutputSchema,
  props: {},
  async run(context) {
    const projects = await deepgramProjects.listProjects({
      apiKey: context.auth.secret_text,
    });
    return { projects };
  },
});
