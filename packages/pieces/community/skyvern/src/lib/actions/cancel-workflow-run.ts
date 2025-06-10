import { skyVernAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { skyVernProps } from '../common/props';
import { makeClient } from '../common/client';

export const cancelWorkflowRun = createAction({
  auth: skyVernAuth,
  name: 'cancelWorkflowRun',
  displayName: 'Cancel Workflow run',
  description: 'Cancels the running workflow run.',
  props: {
    run_id: skyVernProps.run_id,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const client = makeClient(auth);
    return await client.runs.cancel(propsValue.run_id);
  },
});
