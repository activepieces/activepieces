import { createAction, Property } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderProps } from '../common/props';
import { senderSubscriberWriteOutputSchema } from '../output-schemas';

export const updateSubscriberAction = createAction({
  auth: senderAuth,
  name: 'update_subscriber',
  outputSchema: senderSubscriberWriteOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Subscriber',
  description: 'Update an existing subscriber\'s data',
  audience: 'human',
  aiMetadata: { description: "Updates an existing subscriber's name, phone, or custom fields in a Sender account, identified by subscriber ID. Use when the contact already exists and you only need to change attributes; to create-or-update by email use Add / Update Subscriber instead. Idempotent: applying the same values repeatedly yields the same result.", idempotent: true },
  props: {
    subscriber: senderProps.subscriber({ required: true }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Subscriber email address to update',
      required: true,
    }),
    firstname: Property.ShortText({
      displayName: 'First Name',
      description: 'New first name',
      required: false,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      description: 'New last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'New phone number',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'JSON object with custom field keys and values to update',
      required: false,
    }),
  },
  async run(context) {
    return await senderApi.updateSubscriber({
      auth: context.auth,
      subscriberId: context.propsValue.subscriber,
      firstname: context.propsValue.firstname,
      lastname: context.propsValue.lastname,
      phone: context.propsValue.phone,
      customFields: context.propsValue.customFields,
    });
  },
});
