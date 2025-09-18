import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: frontAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Front.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the contact.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A description for the contact.',
      required: false,
    }),
    handles: Property.Array({
      displayName: 'Handles',
      description: 'List of contact handles (e.g., email, phone).',
      required: true,

      properties: {
        handle: Property.ShortText({
          displayName: 'Handle Value',
          description: 'The value of the handle (e.g., email address).',
          required: true,
        }),
        source: Property.ShortText({
          displayName: 'Source',
          description: 'The type of handle (e.g., email, phone).',
          required: true,
        }),
      },
    }),

    avatar_url: Property.File({
      displayName: 'Avatar URL',
      description: 'URL of the contact’s avatar image.',
      required: false,
    }),
    links: Property.Array({
      displayName: 'Links',
      description: 'List of URLs associated with the contact.',
      required: false,
      properties: {
        item: Property.ShortText({
          displayName: 'Link',
          required: true,
        }),
      },
    }),
    group_names: Property.Array({
      displayName: 'Group Names',
      description: 'List of group names to associate with the contact.',
      required: false,
      properties: {
        item: Property.ShortText({
          displayName: 'Group Name',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { description, handles, name, avatar_url, links, group_names } = propsValue;
    const body: Record<string, unknown> = {
      handles,
    };
    if (description) body['description'] = description;
    if (name) body['name'] = name;
    if (avatar_url) body['avatar_url'] = avatar_url;
    if (links) body['links'] = links;
    if (group_names) body['group_names'] = group_names;
    return await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/contacts',
      body
    );
  },
});
