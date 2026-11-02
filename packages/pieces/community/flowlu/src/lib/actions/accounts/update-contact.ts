import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { flowluProps, flowluWire } from '../../common/props';
import { accountEnvelopeOutputSchema } from '../../output-schemas';

export const updateContactAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_contact',
  classification: 'WRITE',
  displayName: 'Update CRM Account(Contact)',
  description: 'Updates an existing contact in CRM.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates fields on an existing CRM account (contact) in Flowlu, identified by its account id. Use to change details such as name, contact info, or category on a known contact. Only the fields you fill are sent, so other fields keep their values; the account type is never changed. The id is required and must reference an existing contact. Idempotent: repeating the same update leaves the contact unchanged. For agents use flowlu_account_update.',
    idempotent: true,
  },
  props: {
    id: flowluCommon.contact_id(true),
    honorific_title_id: flowluCommon.honorific_title_id(false),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    middle_name: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    ...flowluProps.account,
  },
  outputSchema: accountEnvelopeOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.id,
      name: 'Contact ID',
    });
    const client = makeClient(context.auth);
    return await client.updateContact(
      id,
      flowluWire.account(context.propsValue)
    );
  },
});
