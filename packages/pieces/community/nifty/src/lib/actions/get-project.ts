import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyOps } from '../common/operations';
import { projectOutputSchema } from '../output-schemas';

export const getProject = createAction({
  auth: niftyAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description: 'Get a project by its ID.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Nifty project by ID with its portfolio, access level, default view, archive state, owner and progress. Use to check a project before creating tasks or milestones in it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', required: true }),
  },
  outputSchema: projectOutputSchema,
  async run(context) {
    return niftyOps.getProject({ auth: context.auth, projectId: context.propsValue.project_id });
  },
});
