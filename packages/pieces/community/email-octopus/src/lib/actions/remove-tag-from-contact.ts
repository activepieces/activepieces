import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { octopusauth } from '../../index';
import { createHash } from 'crypto';

export const removeTagFromContact = createAction({
  auth: octopusauth,
  name: 'removeTagFromContact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove one or more tags from a contact in a specified list.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact',
      required: true,
    }),
    tags: Property.LongText({
      displayName: 'Tags',
      description: 'Comma-separated list of tag names to remove',
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
        tagsObject[tag] = false; // false to remove tags
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