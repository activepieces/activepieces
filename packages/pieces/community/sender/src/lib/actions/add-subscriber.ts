import { createAction, Property } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderProps } from '../common/props';
import { senderSubscriberWriteOutputSchema } from '../output-schemas';

export const addUpdateSubscriberAction = createAction({
  auth: senderAuth,
  name: 'add_update_subscriber',
  outputSchema: senderSubscriberWriteOutputSchema,
  classification: 'WRITE',
  displayName: 'Add / Update Subscriber',
  description: 'Add a new subscriber or update existing subscriber\'s data',
  audience: 'human',
  aiMetadata: { description: 'Upserts a subscriber in a Sender account by email: creates the contact if the email is new, otherwise updates its name, phone, group membership, and custom fields. Use to ensure a contact exists with given details before campaigns or grouping. Keyed on email, so repeating the same call is idempotent (no duplicate contact); note the optional flag that triggers automation workflows on the subscriber.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Subscriber email address',
      required: true,
    }),
    firstname: Property.ShortText({
      displayName: 'First Name',
      description: 'Subscriber first name',
      required: false,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      description: 'Subscriber last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Subscriber phone number',
      required: false,
    }),
    groups: senderProps.groupIds({ required: false }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'JSON object with custom field keys and values',
      required: false,
    }),
    triggerAutomation: Property.Checkbox({
      displayName: 'Trigger Automation',
      description: 'Whether to trigger automation workflows',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return await senderApi.upsertSubscriber({
      auth: context.auth,
      email: context.propsValue.email,
      firstname: context.propsValue.firstname,
      lastname: context.propsValue.lastname,
      phone: context.propsValue.phone,
      groups: context.propsValue.groups,
      customFields: context.propsValue.customFields,
      triggerAutomation: context.propsValue.triggerAutomation ? true : undefined,
    });
  },
});
