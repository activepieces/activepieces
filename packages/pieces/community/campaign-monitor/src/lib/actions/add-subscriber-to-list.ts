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

export const addSubscriberToListAction = createAction({
  auth: campaignMonitorAuth,
  name: 'add_subscriber_to_list',
  classification: 'WRITE',
  displayName: 'Add Subscriber',
  description: 'Adds a new subscriber to a list.',
  outputSchema: subscriptionResultOutputSchema,
  audience: 'human',
  aiMetadata: {
    description:
      'Builder form with a custom field per list field; agents use the JSON fields variant. Adds a subscriber (by email) to a specific Campaign Monitor list under a client, optionally setting name, phone, custom fields, and tracking/SMS consent. Choose this to enroll a new contact into an email list; enable Resubscribe to re-add someone who previously unsubscribed. Not idempotent: each call posts a new subscription and may overwrite or re-add the contact, so guard against duplicate runs.',
    idempotent: false,
  },
  props: {
    clientId: clientId,
    listId: listId,
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
      name,
      phone,
      consentToSendSms,
      consentToTrack,
      resubscribe,
      fields,
    } = propsValue;

    const dateKeys = await fetchDateFieldKeys({
      auth: { apiKey: auth.secret_text },
      listId,
    });

    const payload = {
      EmailAddress: email,
      Name: name || '',
      ConsentToTrack: consentToTrack ?? 'Unchanged',
      ConsentToSendSms: consentToSendSms ?? 'Unchanged',
      Resubscribe: resubscribe ?? false,
      MobileNumber: phone,
      CustomFields: buildCustomFieldsPayload({ fields, dateKeys }),
    };

    const response = await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/subscribers/${listId}.json`,
      body: payload,
    });

    return {
      success: true,
      emailAddress: typeof response.body === 'string' ? response.body : email,
      listId,
    };
  },
});
