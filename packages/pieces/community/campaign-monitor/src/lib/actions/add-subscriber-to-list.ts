import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';
import { clientId, customFields, listId } from '../common/props';
import { HttpStatusCode } from 'axios';

export const addSubscriberToListAction = createAction({
  auth: campaignMonitorAuth,
  name: 'add_subscriber_to_list',
  displayName: 'Add Subscriber',
  description: 'Adds a new subscriber to a list.',
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
    fields:customFields,
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
      fields
    } = propsValue;

    const payload = {
      EmailAddress: email,
      Name: name || '',
      ConsentToTrack: consentToTrack,
      ConsentToSendSms: consentToSendSms,
      Resubscribe: resubscribe ?? true,
      MobileNumber: phone,
      CustomFields: Object.entries(fields).flatMap(([key, value]) =>
    Array.isArray(value)
      ? value.map((v) => ({ Key: key, Value: v }))
      : [{ Key: key, Value: value }]
  ),
    };

    const response = await makeRequest(
      { apiKey: auth as string },
      HttpMethod.POST,
      `/subscribers/${listId}.json`,
      payload
    );

    if (response.status === HttpStatusCode.Created) {
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
