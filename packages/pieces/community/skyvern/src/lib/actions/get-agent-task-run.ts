import { createAction } from '@activepieces/pieces-framework';
import { skyVernAuth } from '../../index';
import { skyVernProps } from '../common/props';
import { makeClient } from '../common/client';
export const getAgentTaskRun = createAction({
  auth: skyVernAuth,
  name: 'getAgentTaskRun',
  displayName: 'Get Agent Task run',
  description: 'Retrieve full run data for dashboards or audits.',
  props: {
    run_id: skyVernProps.run_id,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const client = makeClient(auth);
    return await client.runs.get(propsValue.run_id);
  },
});
