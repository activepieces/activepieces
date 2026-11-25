import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import { V3_SHUTDOWN_MESSAGE } from './get-job-results';

export const launchWorkflow = createAction({
  name: 'launchWorkflow',
  classification: 'WRITE',
  displayName: '(Deprecated) Launch a workflow',
  description:
    'No longer works: Captain Data shut down its v3 workflows API on 2026-01-09. Use the People and Company actions instead.',
  audience: 'human',
  auth: captainDataAuth,
  requireAuth: false,
  props: {
    workflow: Property.ShortText({
      displayName: 'Workflow',
      required: false,
    }),
    jobName: Property.ShortText({
      displayName: 'Job name',
      required: false,
    }),
    inputs: Property.Json({
      displayName: 'Inputs',
      required: false,
    }),
    steps: Property.Json({
      displayName: 'Steps',
      required: false,
    }),
    delay: Property.Number({
      displayName: 'Delay (seconds)',
      required: false,
    }),
  },
  async run() {
    throw new Error(V3_SHUTDOWN_MESSAGE);
  },
});
