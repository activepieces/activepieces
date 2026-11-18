import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const getOpportunity = createAction({
  auth: closeAuth,
  name: 'get_opportunity',
  classification: 'READ',
  displayName: 'Get Opportunity',
  description: 'Get one opportunity by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Close opportunity by ID (oppo_...), including lead, status, owner, value in cents, confidence and close date. Use List Opportunities to find IDs.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.opportunity,
  props: {
    opportunityId: Property.ShortText({ displayName: 'Opportunity ID', description: 'oppo_...', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = closeClient.closeId({ value: propsValue.opportunityId, label: 'Opportunity ID', prefix: 'oppo' });
    const raw = await closeClient.request({ auth, method: HttpMethod.GET, path: `/opportunity/${closeClient.pathId(id)}/` });
    return closeMappers.opportunity(raw);
  },
});

export { getOpportunity };
