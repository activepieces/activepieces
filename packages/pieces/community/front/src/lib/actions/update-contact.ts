import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { contactIdDropdown } from '../common/dropdown';

export const updateContact = createAction({
  auth: frontAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in Front.',
  props: {
    contact_id: contactIdDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name for the contact.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A new description for the contact.',
      required: false,
    }),
    avatar_url: Property.ShortText({
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
  },
  async run({ auth, propsValue }) {
    const { contact_id, name, description, avatar_url, links } = propsValue;
    const path = `/contacts/${contact_id}`;
    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (description) body['description'] = description;
    if (avatar_url) body['avatar_url'] = avatar_url;
    if (links) body['links'] = links;

    return await makeRequest(auth.access_token, HttpMethod.PATCH, path, body);
  },
});