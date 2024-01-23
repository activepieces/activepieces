import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../../';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_project',
  displayName: 'Delete Project',
  description: 'Deletes a project in clockodo',
  props: {
    project_id: clockodoCommon.project_id(true, false, false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    await client.deleteProject(propsValue.project_id as number);
  },
});
