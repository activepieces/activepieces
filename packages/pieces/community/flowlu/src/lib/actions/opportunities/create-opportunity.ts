import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const createOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new sales opportunity (deal) in Flowlu CRM, requiring a title. Use to open a new deal, optionally linking it to an account, sales pipeline, and stage. Not idempotent — each call creates a new opportunity record.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    ...flowluProps.opportunity,
  },
  async run(context) {
    const client = makeClient(
      context.auth
    );
    return await client.createOpportunity(context.propsValue);
  },
});
