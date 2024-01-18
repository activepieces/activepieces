import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../../';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description: 'Retrieves a single project from clockodo',
  props: {
    project_id: clockodoCommon.project_id(true, false, null),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.getProject(propsValue.project_id as number);
    return res.project;
  },
});
