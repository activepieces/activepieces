import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../../';
import { makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const createOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity.',
  props: {
    name: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    ...flowluProps.opportunity,
  },
  async run(context) {
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.createOpportunity(context.propsValue);
  },
});
