import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { projectEmbedOutputSchema } from '../../common/output-schemas';

export const aiGetProject = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Gets one project by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Reads one Capsule CRM project (case) by its numeric ID, with party, stage, status, linked opportunity, owner and tags. Read-only.',
    idempotent: true,
  },
  outputSchema: projectEmbedOutputSchema,
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', description: 'Numeric ID of the project.', required: true }),
  },
  async run({ auth, propsValue }) {
    return capsuleCrmClient.getProject({ auth, projectId: capsuleCrmClient.segment(propsValue.project_id) });
  },
});
