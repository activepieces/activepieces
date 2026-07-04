import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { FlowluEntity, FlowluModule } from '../../common/constants';

export const deleteOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_opportunity',
  displayName: 'Delete Opportunity',
  description: 'Deletes an existing opportunity.',
  audience: 'both',
  aiMetadata: { description: 'Deletes a sales opportunity (deal) in Flowlu CRM by its opportunity id. Use to permanently remove a deal. Effectively idempotent in end state once removed, but it mutates data and a repeat call targets an already-deleted record.', idempotent: false },
  props: {
    id: flowluCommon.opportunity_id(true),
  },
  async run(context) {
    const id = context.propsValue.id!;
    const client = makeClient(
      context.auth
    );
    return await client.deleteAction(
      FlowluModule.CRM,
      FlowluEntity.OPPORTUNITY,
      id
    );
  },
});
