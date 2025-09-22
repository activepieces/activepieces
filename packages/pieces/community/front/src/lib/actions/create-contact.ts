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
        source: Property.StaticDropdown({
          displayName: 'Handle Type',
          description: 'Type of handle to add.',
          required: true,
          options: {
            options: [
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'phone' },
              { label: 'Twitter', value: 'twitter' },
              { label: 'Facebook', value: 'facebook' },
              { label: 'Intercom', value: 'intercom' },
              { label: 'front_chat', value: 'front_chat' },
              { label: 'custom', value: 'custom' },
            ],
          },
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
        link: Property.ShortText({
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
        group_names: Property.ShortText({
          displayName: 'Group Name',
          required: true,
        }),
      },
    }),
    list_names: Property.Array({
      displayName: 'Contact Lists',
      description: 'List of contact list names this contact belongs to. Front will create any that do not exist.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom fields for this contact, as a JSON object (e.g., {"CRM ID": "12345"}).',
      required: false,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { description, handles, name, avatar_url, links, group_names,list_names,custom_fields } = propsValue;
    const body: Record<string, unknown> = {
      handles,
    };
    if (description) body['description'] = description;
    if (name) body['name'] = name;
    if (avatar_url) body['avatar_url'] = avatar_url;
    if (links) body['links'] = links;
    if (group_names) body['group_names'] = group_names;
    if(list_names) body['list_names']=list_names;
    if(custom_fields) body['custom_fields']=custom_fields;
    return await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/contacts',
      body
    );
  },
});
