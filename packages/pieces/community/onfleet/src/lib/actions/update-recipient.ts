import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const updateRecipient = createAction({
  auth: onfleetAuth,
  name: 'update_recipient',
  displayName: 'Update Recipient',
  description: 'Updates a recipient',
  audience: 'both',
  aiMetadata: {
    description:
      'Update an existing Onfleet recipient identified by recipient ID, changing name, notes, or the skip-SMS-notifications setting. Idempotent: it modifies the same record in place by ID, so repeated calls with the same values leave it unchanged. Use Create Recipient when no recipient exists yet.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Recipient ID',
      description: 'The ID of the recipient you want to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: "The recipient's full name",
      required: false,
    }),
    notes: Property.ShortText({
      displayName: 'Notes',
      required: false,
    }),
    skipSMSNotifications: Property.Checkbox({
      displayName: 'Skip SMS Notifications',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);
    const recipient: any = {
      name: context.propsValue['name'] ?? undefined,
      notes: context.propsValue['notes'] ?? undefined,
      skipSMSNotifications:
        context.propsValue['skipSMSNotifications'] ?? undefined,
    };

    return await onfleetApi.recipients.update(
      context.propsValue['id'],
      recipient
    );
  },
});
