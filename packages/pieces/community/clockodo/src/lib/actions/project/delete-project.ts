import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, makeClient, deletedResult } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_project',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Project',
  description: 'Permanently deletes a project in Clockodo. The project must be set inactive first (Update Project › Active Status = No).',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: { description: 'Permanently delete a Clockodo project by its numeric project ID. The project must be inactive first (Update Project with Active Status = No), otherwise Clockodo refuses. Destructive and not safely repeatable: a second call for the same ID fails because the project no longer exists. Confirm the correct ID before calling.', idempotent: false },
  props: {
    project_id: {
      ...clockodoCommon.project_id(true, false, false),
      description: 'Only inactive projects can be deleted; set it inactive first (Update Project › Active Status = No).',
    },
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.project_id, field: 'Project' });
    await makeClient(auth.props).deleteProject(id);
    return deletedResult(id);
  },
});
