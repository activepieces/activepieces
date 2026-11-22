import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'list_subprojects',
  classification: 'SEARCH',
  displayName: 'Get Subprojects',
  description: 'Fetches subprojects from Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.subprojects,
  aiMetadata: {
    description:
      'Lists Clockodo subprojects (id, name, parent project id), optionally only those of one project given by its numeric project id from Get Projects, following every page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Only return subprojects of this project (numeric ID from Get Projects)',
      required: false,
    }),
    active_only: Property.Checkbox({
      displayName: 'Only Active',
      description: 'Only return active subprojects',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const subprojects = await makeClient(auth.props).listSubprojects({
      projects_id: clockodoRequests.parseOptionalId({ value: propsValue.project_id, field: 'Project ID' }),
      active: propsValue.active_only ? true : undefined,
    });
    return {
      subprojects,
    };
  },
});
