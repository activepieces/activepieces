import { createAction } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

export const listLeadStatuses = createAction({
  auth: closeAuth,
  name: 'list_lead_statuses',
  classification: 'SEARCH',
  displayName: 'List Lead Statuses',
  description: 'List the lead statuses defined in Close.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every lead status in the Close organization with id (stat_...) and label. Use the id as the status when creating or updating a lead. Returns all statuses in one call. Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.statuses,
  props: {},
  async run({ auth }) {
    const { items, truncated } = await closeClient.listAll({ auth, path: '/status/lead/' });
    return closeMappers.offsetPage({ items, hasMore: truncated, nextSkip: null, map: closeMappers.status });
  },
});
