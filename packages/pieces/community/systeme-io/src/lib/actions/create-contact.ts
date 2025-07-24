import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface SystemeIoContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  [key: string]: unknown;
}

export const createContact = createAction({
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a contact with email, name, and tags in systeme.io.',
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    tags: Property.MultiSelectDropdown({
      displayName: 'Tags',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.systeme.io/api/tags',
          headers: {
            'X-API-Key': String(auth),
          },
        });
        const items = response.body.items || [];
        return {
          options: items.map((tag: any) => ({
            label: `${tag.name} (ID: ${tag.id})`,
            value: tag.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const email = context.propsValue['email'];
    const firstName = context.propsValue['firstName'];
    const lastName = context.propsValue['lastName'];
    let tags = context.propsValue['tags'];
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format.');
    }
    // Ensure tags are numbers if provided
    if (tags && tags.length > 0) {
      tags = tags.map((t) => typeof t === 'string' ? Number(t) : t);
    }
    const body: Record<string, unknown> = { email };
    if (firstName) body['firstName'] = firstName;
    if (lastName) body['lastName'] = lastName;
    if (tags && tags.length > 0) body['tags'] = tags;

    const response = await httpClient.sendRequest<SystemeIoContact>({
      method: HttpMethod.POST,
      url: 'https://api.systeme.io/api/contacts',
      headers: {
        'X-API-Key': String(context.auth),
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
}); 