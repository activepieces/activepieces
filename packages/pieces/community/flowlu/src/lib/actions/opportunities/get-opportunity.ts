import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { opportunityOutputSchema } from '../../output-schemas';

export const getOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_get_opportunity',
  classification: 'READ',
  displayName: 'Get Opportunity',
  description: 'Gets a CRM opportunity by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Flowlu opportunity (deal: name, amount, pipeline and stage, status, assignee, dates) by its numeric opportunity_id. Use to read a deal before updating or closing it; use flowlu_find_opportunities to look deals up by name or pipeline. Fails if it does not exist. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    opportunity_id: Property.ShortText({
      displayName: 'Opportunity ID',
      description:
        'Numeric opportunity ID, such as "42". Map it from an earlier step or from Find Opportunities.',
      required: true,
    }),
  },
  outputSchema: opportunityOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.opportunity_id,
      name: 'Opportunity ID',
    });
    return makeClient(context.auth).getRecord('crm', 'lead', id);
  },
});
