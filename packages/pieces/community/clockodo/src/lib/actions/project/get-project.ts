import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Retrieves a single project from Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.project,
  aiMetadata: { description: 'Fetch one Clockodo project by its numeric project ID. Read-only and repeatable. Use when you already have the project ID and need its current fields (name, customer, budget, active/completed state); to find a project by name or list many, use Get Projects instead.', idempotent: true },
  props: {
    project_id: clockodoCommon.project_id(true, false, null),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.project_id, field: 'Project' });
    return makeClient(auth.props).getProject(id);
  },
});
