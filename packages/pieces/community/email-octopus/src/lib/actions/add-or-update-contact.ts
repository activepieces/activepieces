import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { octopusauth } from '../../index';

export const addOrUpdateContact = createAction({
  auth: octopusauth,
  name: 'addOrUpdateContact',
  displayName: 'Add or Update Contact',
  description: 'If the contact does not exist, it will be created. If the contact already exists, it will be updated.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to add the contact to',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the contact',
      required: false,
      defaultValue: 'SUBSCRIBED',
      options: {
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
        ],
      },
    }),
    customFields: Property.DynamicProperties({
      displayName: 'Custom Fields',
      description: 'Available fields for this list',
      required: false,
      refreshers: ['listId'],
      props: async (propsValue) =>{
        const authentication = propsValue['auth'];
        const listId = propsValue['listId'];

        if(!authentication || !listId){
          return {};
        }

        try {
          // Fetch list details to get available fields
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.emailoctopus.com/lists/${listId}`,
            headers: {
              'Authorization': `Bearer ${authentication}`,
            },
          });

          const listData = response.body;
          const fields = listData?.fields || [];
          
          const dynamicProps: any = {};
          
          // Create dynamic properties for each field
          fields.forEach((field: any) => {
            dynamicProps[field.tag] = Property.ShortText({
              displayName: field.label,
              description: `Enter value for ${field.label}`,
              required: false,
            });
          });

          return dynamicProps;
        } catch (error) {
          console.error('Error fetching list fields:', error);
          return {};
        }

      }
    }),
  },
  async run({ auth, propsValue }) {
    const { listId, email, customFields, status } = propsValue;
    
    const body: any = {
      email_address: email,
      status: status || 'SUBSCRIBED',
    };

    // Add custom fields if they exist
    if (customFields && Object.keys(customFields).length > 0) {
      body.fields = {};
      Object.keys(customFields).forEach(fieldTag => {
        if (customFields[fieldTag]) {
          body.fields[fieldTag] = customFields[fieldTag];
        }
      });
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.emailoctopus.com/lists/${listId}/contacts`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth}`,
        },
        body,
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 409) {
        const updateResponse = await httpClient.sendRequest({
          method: HttpMethod.PUT,
          url: `https://api.emailoctopus.com/lists/${listId}/contacts/${encodeURIComponent(email)}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth}`,
          },
          body,
        });
        return updateResponse.body;
      }
      
      throw error;
    }
  },
});