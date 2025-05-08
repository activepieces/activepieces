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
    // First, try to create the custom field if it doesn't exist
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.manychat.com/fb/page/createCustomField',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
        body: {
          caption: field_name,
          type: 'text',
          description: `This field stores ${field_name}`
        },
      });
    } catch (error) {
      // If the field already exists, the API will return an error, but we can proceed
      // with setting the custom field value
      console.log(`Custom field creation error (may already exist): ${error}`);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.manychat.com/fb/subscriber/setCustomFieldByName',
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
