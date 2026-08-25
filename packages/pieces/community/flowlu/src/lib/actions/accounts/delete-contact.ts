import {
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { FlowluEntity, FlowluModule } from '../../common/constants';

export const deleteContactAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_delete_contact',
  displayName: 'Delete CRM Account(Contact)',
  description: 'Deletes an existing contact in CRM.',
  audience: 'both',
  aiMetadata: { description: 'Deletes a CRM account (contact) in Flowlu by its account id. Use to remove a contact record permanently. Effectively idempotent in end state once the record is gone, but it mutates data and a repeat call targets an already-deleted record.', idempotent: false },
  props: {
    id: flowluCommon.contact_id(true),
  },
  async run(context) {
    const id = context.propsValue.id!;
    const client = makeClient(
      context.auth
    );
    return await client.deleteAction(
      FlowluModule.CRM,
      FlowluEntity.ACCOUNT,
      id
    );
  },
});
