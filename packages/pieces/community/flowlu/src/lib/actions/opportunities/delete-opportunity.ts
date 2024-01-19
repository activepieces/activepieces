import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../../';
import { flowluCommon, makeClient } from '../../common';
import { FlowluEntity, FlowluModule } from '../../common/constants';

export const deleteOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_opportunity',
  displayName: 'Delete Opportunity',
  description: 'Deletes an existing opportunity.',
  props: {
    id: flowluCommon.opportunity_id(true),
  },
  async run(context) {
    const id = context.propsValue.id!;
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.deleteAction(
      FlowluModule.CRM,
      FlowluEntity.OPPORTUNITY,
      id
    );
  },
});
