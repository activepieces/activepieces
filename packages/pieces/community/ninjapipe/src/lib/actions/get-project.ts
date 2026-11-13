import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getProject = createAction({
  auth: ninjapipeAuth,
  name: 'get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Gets one project by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single NinjaPipe project by ID. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.project,
  props: {
    projectId: ninjapipeProps.projectRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.projectId, field: 'Project' });
    return ninjapipeClient.getRecord({ auth: ninjapipeClient.readAuth(context.auth), path: `/projects/${id}`, operation: 'get project' });
  },
});
