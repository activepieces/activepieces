import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const updateOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity.',
  audience: 'both',
  aiMetadata: { description: 'Updates fields on an existing sales opportunity (deal) in Flowlu CRM, identified by its opportunity id. Use to change a deal\'s title, pipeline stage, linked account, or other details. The id is required and must reference an existing opportunity.', idempotent: false },
  props: {
    id: flowluCommon.opportunity_id(true),
    name: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    ...flowluProps.opportunity,
  },
  async run(context) {
    const id = context.propsValue.id!;
    const client = makeClient(
      context.auth
    );
    return await client.updateOpportunity(id, context.propsValue);
  },
});
