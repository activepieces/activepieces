import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';

const getJobResults = createAction({
  name: 'getJobResults',
  classification: 'READ',
  displayName: '(Deprecated) Get job results',
  description:
    'No longer works: Captain Data shut down its v3 jobs API on 2026-01-09. Use the People and Company actions instead.',
  audience: 'human',
  auth: captainDataAuth,
  requireAuth: false,
  props: {
    workflow: Property.ShortText({
      displayName: 'Workflow',
      required: false,
    }),
    job: Property.ShortText({
      displayName: 'Job',
      required: false,
    }),
  },
  async run() {
    throw new Error(V3_SHUTDOWN_MESSAGE);
  },
});

const V3_SHUTDOWN_MESSAGE =
  'Captain Data v3 (workflows/jobs) was shut down on 2026-01-09. Use the new People/Company actions.';

export { getJobResults, V3_SHUTDOWN_MESSAGE };
