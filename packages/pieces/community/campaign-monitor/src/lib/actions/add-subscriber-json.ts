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

export const addSubscriberJsonAction = createAction({
  auth: campaignMonitorAuth,
  name: 'add_subscriber_json',
  classification: 'WRITE',
  displayName: 'Add Subscriber (JSON fields)',
  description: 'Adds a subscriber to a list, with custom fields as JSON.',
  outputSchema: subscriptionResultOutputSchema,
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a subscriber (by email) to a Campaign Monitor list given its list ID, optionally setting name, phone, tracking/SMS consent and custom fields passed as a JSON object keyed by field name (spaces are ignored, so "Favorite Color" maps to [FavoriteColor]), e.g. {"Company":"Acme","Age":30}; use an array value for multi-select fields and YYYY-MM-DD for dates. Empty values are skipped. Use List Lists to find the list ID. Enable Resubscribe to re-add someone who previously unsubscribed. Not idempotent: each call posts a new subscription and may overwrite or re-add the contact.',
    idempotent: false,
  },
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'ID of the list to add the subscriber to.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
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
      required: true,
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
    const response = await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/subscribers/${encodeURIComponent(listId)}.json`,
      body: {
        EmailAddress: email,
        Name: propsValue.name ?? '',
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
      emailAddress: typeof response.body === 'string' ? response.body : email,
      listId,
    };
  },
});
