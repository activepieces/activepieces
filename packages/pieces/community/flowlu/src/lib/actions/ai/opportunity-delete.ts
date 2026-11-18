import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { deletedOutputSchema } from '../../output-schemas';

export const flowluOpportunityDelete = createAction({
  auth: flowluAuth,
  name: 'flowlu_opportunity_delete',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Opportunity',
  description: 'Deletes a CRM opportunity.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Flowlu opportunity (deal) by its numeric opportunity_id. Use only when the deal must be removed; to close it instead, set status won or lost with flowlu_opportunity_update. Not idempotent: a second call fails because the opportunity no longer exists.',
    idempotent: false,
  },
  props: {
    opportunity_id: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'Numeric ID of the opportunity to delete, such as "42".',
      required: true,
    }),
  },
  outputSchema: deletedOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.opportunity_id,
      name: 'Opportunity ID',
    });
    const res = await makeClient(context.auth).deleteRecord('crm', 'lead', id);
    return { id: Number(res.id ?? id), deleted: true };
  },
});
