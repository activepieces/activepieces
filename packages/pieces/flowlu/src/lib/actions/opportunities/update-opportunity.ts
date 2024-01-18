import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../../';
import { flowluCommon, makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const updateOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity.',
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
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.updateOpportunity(id, context.propsValue);
  },
});
