import { createAction, Property } from '@activepieces/pieces-framework';
import { octopusauth } from '../../index';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createHash } from 'crypto';

export const unsubscribeContact = createAction({
  auth: octopusauth,
  name: 'unsubscribeContact',
  displayName: 'Unsubscribe Contact',
  description: 'Remove a contact from a list (unsubscribe).',
  props: {
      listId: Property.Dropdown({
      displayName: 'List ID',
      description: 'The ID of the list to search in',
      required: true,
      refreshers: [],
      options: async ({auth}) =>{
        if(!auth){
          return{
            disabled:true,
            options: [],
            placeholder: 'Please authenticate first!',
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.emailoctopus.com/lists',
            headers: {
              'Authorization': `Bearer ${auth}`,
            },
          });

          const lists = response.body.data || [];
          return {
            options: lists.map((list: any) => ({
              label: list.name,
              value: list.id
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load lists'
          };
        }
      }
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact to find',
      required: true,
    }),
  },
  async run({auth, propsValue}) {
    // Action logic here
    const { listId, email } = propsValue;
        
        const contactId = createHash('md5').update(email.toLowerCase()).digest('hex');
        
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `https://api.emailoctopus.com/lists/${listId}/contacts/${contactId}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth}`,
          },
        });
    
        return response.body;
  },
});
