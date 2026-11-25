import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { opportunityEmbedOutputSchema } from '../../common/output-schemas';

export const aiGetOpportunity = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_get_opportunity',
  classification: 'READ',
  displayName: 'Get Opportunity',
  description: 'Gets one opportunity by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Reads one Capsule CRM opportunity by its numeric ID, with party, milestone, value, probability, expected close date, owner and tags. Read-only.',
    idempotent: true,
  },
  outputSchema: opportunityEmbedOutputSchema,
  props: {
    opportunity_id: Property.ShortText({ displayName: 'Opportunity ID', description: 'Numeric ID of the opportunity.', required: true }),
  },
  async run({ auth, propsValue }) {
    return capsuleCrmClient.getOpportunity({ auth, opportunityId: capsuleCrmClient.segment(propsValue.opportunity_id) });
  },
});
