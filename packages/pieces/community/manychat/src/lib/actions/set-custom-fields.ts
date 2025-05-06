import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const setCustomField = createAction({
  name: 'setCustomField',
  displayName: 'Set Custom Field',
  description: 'Update user\'s custom field values like "Last Product Viewed" or "Location".',
  props: {
    subscriber_id: Property.Number({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber whose custom field will be updated',
      required: true,
    }),
    field_name: Property.ShortText({
      displayName: 'Field Name',
      description: 'The name of the custom field to update',
      required: true,
    }),
    field_value: Property.ShortText({
      displayName: 'Field Value',
      description: 'The value to set for the custom field',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { subscriber_id, field_name, field_value } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.manychat.com/fb/subscriber/setCustomField',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json'
      },
      body: {
        subscriber_id: subscriber_id,
        field_name: field_name,
        field_value: field_value
      }
    });

    return response.body;
  },
});
