import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient, tarventCommon } from '../common';
import { ContactStatus } from '../common/types';

export const updateContactStatus = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_status',
  displayName: 'Subscribe/Unsubscribe Contact From Audience',
  description: 'Subscribes or unsubscribe a contact in an audience.',
  audience: 'both',
  aiMetadata: { description: 'Sets a Tarvent contact\'s subscription status to subscribed (active) or unsubscribed (opt-out), chosen by the action input. Use to manage consent or suppression for a contact. Idempotent: it sets an absolute status, so repeating with the same value yields the same state.', idempotent: true },
  props: {
    contactId: tarventCommon.contactId,
    action: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Select whether to subscribe or unsubscribe the contact.',
      required: true,
      options: {
        options: [
          {
            label: 'Subscribe',

            value: 'ACTIVE',
          },
          {
            label: 'Unsubscribe',
            value: 'OPT_OUT',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { contactId, action } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.updateContactStatus(contactId, action as ContactStatus);
  },
});
