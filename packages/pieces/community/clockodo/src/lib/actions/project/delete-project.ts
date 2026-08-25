import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_project',
  displayName: 'Delete Project',
  description: 'Deletes a project in clockodo',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a clockodo project by its numeric project ID. Destructive and not safely repeatable: a second call for the same ID fails because the project no longer exists. Confirm the correct ID before calling.', idempotent: false },
  props: {
    project_id: clockodoCommon.project_id(true, false, false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    await client.deleteProject(propsValue.project_id as number);
  },
});
