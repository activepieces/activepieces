import { createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { FlowluEntity, FlowluModule } from '../../common/constants';
import { deletedEnvelopeOutputSchema } from '../../output-schemas';

export const deleteOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_opportunity',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Opportunity',
  description: 'Deletes an existing opportunity.',
  audience: 'human',
  aiMetadata: {
    description:
      'Deletes a sales opportunity (deal) in Flowlu CRM by its opportunity id. Use to permanently remove a deal. Effectively idempotent in end state once removed, but it mutates data and a repeat call targets an already-deleted record. For agents use flowlu_opportunity_delete.',
    idempotent: false,
  },
  props: {
    id: flowluCommon.opportunity_id(true),
  },
  outputSchema: deletedEnvelopeOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.id,
      name: 'Opportunity ID',
    });
    const client = makeClient(context.auth);
    return await client.deleteAction(
      FlowluModule.CRM,
      FlowluEntity.OPPORTUNITY,
      id
    );
  },
});
