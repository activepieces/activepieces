import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description: 'Retrieves a single project from clockodo',
  audience: 'both',
  aiMetadata: { description: 'Fetch one clockodo project by its numeric project ID. Read-only and repeatable. Use when you already have the project ID and need its current fields (name, customer, budget, active/completed state); to find a project by name or list many, use Get Projects instead.', idempotent: true },
  props: {
    project_id: clockodoCommon.project_id(true, false, null),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const res = await client.getProject(propsValue.project_id as number);
    return res.project;
  },
});
