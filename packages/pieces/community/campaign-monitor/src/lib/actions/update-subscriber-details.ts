import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';
import { clientId, customFields, listId } from '../common/props';
import { HttpStatusCode } from 'axios';

export const updateSubscriberDetailsAction = createAction({
  auth: campaignMonitorAuth,
  name: 'update_subscriber_details',
  displayName: 'Update Subscriber',
  description: 'Update an existing subscriber in a list.',
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
      required: false,
      defaultValue: 'Yes',
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
    fields:customFields,
  },
  async run({ propsValue, auth }) {
    const {
      listId,
      email,
      name,
      consentToSendSms,
      phone,
      resubscribe,
      consentToTrack,
      fields
    } = propsValue;

    const payload = {
      MobileNumber: phone,
      Name: name,
      ConsentToTrack: consentToTrack,
      ConsentToSendSms: consentToSendSms,
      Resubscribe: resubscribe ?? true,
        CustomFields: Object.entries(fields).flatMap(([key, value]) =>
    Array.isArray(value)
      ? value.map((v) => ({ Key: key, Value: v }))
      : [{ Key: key, Value: value }]
  ),
    };

    const response = await makeRequest(
      { apiKey: auth as string },
      HttpMethod.PUT,
      `/subscribers/${listId}.json?email=${encodeURIComponent(email)}`,
      payload
    );

    if (response.status === HttpStatusCode.Ok) {
      return {
        success: true,
      };
    }
    return {
      success: false,
      error: response.body,
    };
  },
});
