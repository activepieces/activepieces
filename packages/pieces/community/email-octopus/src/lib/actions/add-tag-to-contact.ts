import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { octopusauth } from '../../index';
import { createHash } from 'crypto';

export const addTagToContact = createAction({
  auth: octopusauth,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Add one or more tags to a contact in a specified list.',
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
      description: 'The email address of the contact',
      required: true,
    }),
    tags: Property.LongText({
      displayName: 'Tags',
      description: 'Comma-separated list of tag names to add',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { listId, email, tags } = propsValue;
    
    const contactId = createHash('md5').update(email.toLowerCase()).digest('hex');
    
    const tagArray = tags.split(',').map(tag => tag.trim());
    const tagsObject: Record<string, boolean> = {};
    tagArray.forEach(tag => {
      if (tag) {
        tagsObject[tag] = true;
      }
    });

    const body: {
      tags: Record<string, boolean>;
    } = {
      tags: tagsObject,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.emailoctopus.com/lists/${listId}/contacts/${contactId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body,
    });

    return response.body;
  },
});