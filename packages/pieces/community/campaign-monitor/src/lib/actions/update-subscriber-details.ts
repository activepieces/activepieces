import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  buildCustomFieldsPayload,
  fetchDateFieldKeys,
  makeRequest,
} from '../common/client';
import { subscriptionResultOutputSchema } from '../output-schemas';
import { campaignMonitorAuth } from '../auth';
import { clientId, customFields, listId } from '../common/props';

export const updateSubscriberDetailsAction = createAction({
  auth: campaignMonitorAuth,
  name: 'update_subscriber_details',
  classification: 'WRITE',
  displayName: 'Update Subscriber',
  description: 'Update an existing subscriber in a list.',
  outputSchema: subscriptionResultOutputSchema,
  audience: 'human',
  aiMetadata: {
    description:
      'Builder form with a custom field per list field; agents use the JSON fields variant. Updates an existing subscriber, identified by their current email address, in a specific Campaign Monitor list under a client — changing email address (via New Email Address), name, phone, custom fields, and tracking/SMS consent. The output emailAddress is the address the subscriber has after the update. Choose this to modify a contact already on a list rather than to add one. Idempotent when the email is not changed: it keys on the email and overwrites the same record, so repeating with identical input leaves the subscriber in the same state. Custom fields left blank are not sent, so their stored values are kept.',
    idempotent: true,
  },
  props: {
    clientId: clientId,
    listId: listId,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The current email address of the subscriber.',
      required: true,
    }),
    newEmail: Property.ShortText({
      displayName: 'New Email Address',
      description:
        'New email for the subscriber. Leave empty to keep the current one.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    consentToTrack: Property.StaticDropdown({
      displayName: 'Consent to Track',
      description: 'Whether the subscriber has consented to tracking.',
      required: false,
      defaultValue: 'Unchanged',
      options: {
        options: [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' },
          { label: 'Unchanged', value: 'Unchanged' },
        ],
      },
    }),
    consentToSendSms: Property.StaticDropdown({
      displayName: 'Consent to Send SMS',
      required: false,
      description: 'Whether the subscriber has consented to send SMS.',
      defaultValue: 'Unchanged',
      options: {
        options: [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' },
          { label: 'Unchanged', value: 'Unchanged' },
        ],
      },
    }),
    resubscribe: Property.Checkbox({
      displayName: 'Resubscribe',
      description:
        'If true, the subscriber will be resubscribed if they previously unsubscribed.',
      required: false,
      defaultValue: false,
    }),
    fields: customFields,
  },
  async run({ propsValue, auth }) {
    const {
      listId,
      email,
      newEmail,
      name,
      consentToSendSms,
      phone,
      resubscribe,
      consentToTrack,
      fields,
    } = propsValue;

    const dateKeys = await fetchDateFieldKeys({
      auth: { apiKey: auth.secret_text },
      listId,
    });

    const targetEmail = newEmail?.trim() || email;
    const payload = {
      EmailAddress: targetEmail,
      MobileNumber: phone,
      Name: name,
      ConsentToTrack: consentToTrack ?? 'Unchanged',
      ConsentToSendSms: consentToSendSms ?? 'Unchanged',
      Resubscribe: resubscribe ?? false,
      CustomFields: buildCustomFieldsPayload({ fields, dateKeys }),
    };

    await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.PUT,
      path: `/subscribers/${listId}.json?email=${encodeURIComponent(email)}`,
      body: payload,
    });

    return {
      success: true,
      emailAddress: targetEmail,
      listId,
    };
  },
});
