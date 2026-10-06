import { createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { FlowluEntity, FlowluModule } from '../../common/constants';
import { deletedEnvelopeOutputSchema } from '../../output-schemas';

export const deleteContactAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete CRM Account(Contact)',
  description: 'Deletes an existing contact in CRM.',
  audience: 'human',
  aiMetadata: {
    description:
      'Deletes a CRM account (contact) in Flowlu by its account id. Use to remove a contact record permanently. Effectively idempotent in end state once the record is gone, but it mutates data and a repeat call targets an already-deleted record. For agents use flowlu_account_delete.',
    idempotent: false,
  },
  props: {
    id: flowluCommon.contact_id(true),
  },
  outputSchema: deletedEnvelopeOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.id,
      name: 'Contact ID',
    });
    const client = makeClient(context.auth);
    return await client.deleteAction(
      FlowluModule.CRM,
      FlowluEntity.ACCOUNT,
      id
    );
  },
});
