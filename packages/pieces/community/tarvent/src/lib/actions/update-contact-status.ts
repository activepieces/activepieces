import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const updateContactStatus = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_status',
  classification: 'WRITE',
  displayName: 'Subscribe/Unsubscribe Contact From Audience',
  description: 'Subscribes or unsubscribes a contact in an audience.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets one Tarvent contact\'s subscription status to subscribed (ACTIVE) or unsubscribed (OPT_OUT) by contact ID. Unsubscribing stops campaign email to the contact but keeps the record and can be reversed. Use for consent changes; to block an address account-wide use Add Contact To Suppression List. Idempotent: it sets an absolute status.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contactStatus,
  props: {
    contactId: tarventCommon.contactId,
    action: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Select whether to subscribe or unsubscribe the contact.',
      required: true,
      options: {
        options: [
          { label: 'Subscribe', value: 'ACTIVE' },
          { label: 'Unsubscribe', value: 'OPT_OUT' },
        ],
      },
    }),
  },
  async run(context) {
    const id = tarventCommon.requireText({ value: context.propsValue.contactId, label: 'Contact ID' });
    const status = context.propsValue.action;
    if (status !== 'ACTIVE' && status !== 'OPT_OUT') {
      throw new Error('Status must be ACTIVE (subscribe) or OPT_OUT (unsubscribe).');
    }
    await tarventClient.booleanMutation({
      auth: context.auth.props,
      operation: 'UpdateContactStatus',
      field: 'updateContactStatus',
      argDefs: '$input: UpdateContactStatusInput!',
      args: 'input: $input',
      variables: { input: { id, status } },
    });
    return { success: true, contactId: id, status };
  },
});
