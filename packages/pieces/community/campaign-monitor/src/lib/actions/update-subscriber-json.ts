import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  buildCustomFieldsPayload,
  fetchDateFieldKeys,
  jsonCustomFieldsToRecord,
  makeRequest,
} from '../common/client';
import { subscriptionResultOutputSchema } from '../output-schemas';
import { campaignMonitorAuth } from '../auth';

export const updateSubscriberJsonAction = createAction({
  auth: campaignMonitorAuth,
  name: 'update_subscriber_json',
  classification: 'WRITE',
  displayName: 'Update Subscriber (JSON fields)',
  description: 'Updates a subscriber in a list, with custom fields as JSON.',
  outputSchema: subscriptionResultOutputSchema,
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing subscriber, identified by their current email, in a Campaign Monitor list given its list ID: change email (New Email Address), name, phone, tracking/SMS consent and custom fields passed as a JSON object keyed by field name (spaces are ignored, so "Favorite Color" maps to [FavoriteColor]), e.g. {"Company":"Acme","Age":30}; use an array value for multi-select fields and YYYY-MM-DD for dates. Fields left out or empty keep their stored values. The output emailAddress is the address after the update. Idempotent when the email is not changed: repeating with identical input leaves the subscriber in the same state.',
    idempotent: true,
  },
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'ID of the list the subscriber belongs to.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The current email address of the subscriber.',
      required: true,
    }),
    newEmail: Property.ShortText({
      displayName: 'New Email Address',
      description: 'New email for the subscriber. Leave empty to keep it.',
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
      description: 'Whether the subscriber has consented to send SMS.',
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
    resubscribe: Property.Checkbox({
      displayName: 'Resubscribe',
      description: 'Resubscribe the contact if they previously unsubscribed.',
      required: false,
      defaultValue: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description:
        'JSON object of field name to value, e.g. {"Company":"Acme"}.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const listId = propsValue.listId.trim();
    const email = propsValue.email.trim();
    const dateKeys = await fetchDateFieldKeys({
      auth: { apiKey: auth.secret_text },
      listId,
    });
    const targetEmail = propsValue.newEmail?.trim() || email;
    await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.PUT,
      path: `/subscribers/${encodeURIComponent(
        listId
      )}.json?email=${encodeURIComponent(email)}`,
      body: {
        EmailAddress: targetEmail,
        Name: propsValue.name,
        MobileNumber: propsValue.phone,
        ConsentToTrack: propsValue.consentToTrack ?? 'Unchanged',
        ConsentToSendSms: propsValue.consentToSendSms ?? 'Unchanged',
        Resubscribe: propsValue.resubscribe ?? false,
        CustomFields: buildCustomFieldsPayload({
          fields: jsonCustomFieldsToRecord(propsValue.customFields),
          dateKeys,
        }),
      },
    });
    return {
      success: true,
      emailAddress: targetEmail,
      listId,
    };
  },
});
