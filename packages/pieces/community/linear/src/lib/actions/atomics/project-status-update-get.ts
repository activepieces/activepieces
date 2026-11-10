import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearProjectStatusUpdateNode, linearMappers } from '../../common/mappers';
import { PROJECT_STATUS_UPDATE_GET_QUERY } from './queries';
import { atomicProjectStatusUpdateOutputSchema } from './output-schemas';

export const linearProjectStatusUpdateGetAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_status_update_get',
  classification: 'READ',
  displayName: 'Get Project Status Update (AI)',
  description: 'Get one project status update by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Linear project status update (progress report) by ID with its markdown body, health, author and project. Use when the update ID is known, for example from the New Project Status Update trigger; use List Project Status Updates to browse a project\'s history. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    status_update_id: Property.ShortText({ displayName: 'Status Update ID', description: 'UUID of the project status update.', required: true }),
  },
  outputSchema: atomicProjectStatusUpdateOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{ projectUpdate: LinearProjectStatusUpdateNode | null }>({
      auth,
      query: PROJECT_STATUS_UPDATE_GET_QUERY,
      variables: { id: propsValue.status_update_id.trim() },
    });
    if (!data.projectUpdate) {
      throw new Error(`No Linear project status update found for ${propsValue.status_update_id}.`);
    }
    return linearMappers.flattenProjectStatusUpdate(data.projectUpdate);
  },
});
