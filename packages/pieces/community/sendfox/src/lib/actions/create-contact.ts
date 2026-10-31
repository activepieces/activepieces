import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../auth';
import { sendfoxClient } from '../common/client';
import { sendfoxProps } from '../common/props';

export const createContactAction = createAction({
  name: 'create-contact',
  classification: 'WRITE',
  auth: sendfoxAuth,
  displayName: 'Create Contact',
  description: 'Add a contact to SendFox, optionally to one of your lists',
  audience: 'both',
  aiMetadata: { description: 'Adds a new contact (subscriber) to SendFox by email, optionally setting first/last name and assigning the contact to a list. Use to add or onboard a subscriber. Not idempotent: each call posts the contact, so repeating may create or re-add the entry.', idempotent: false },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['email', 'firstname', 'lastname'],
    },
    {
      key: 'list',
      display: 'section',
      label: 'Add to list',
      icon: 'inbox',
      props: ['list'],
    },
  ],
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      placeholder: 'jane@example.com',
    }),
    firstname: Property.ShortText({
      displayName: 'First Name',
      required: false,
      placeholder: 'Jane',
      width: 'half',
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      placeholder: 'Doe',
      width: 'half',
    }),
    list: sendfoxProps.list({
      required: false,
      description: 'Leave empty to add the contact without a list.',
    }),
  },
  async run(context) {
    const { email, firstname, lastname, list } = context.propsValue;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/contacts',
      body: {
        email,
        ...(firstname ? { first_name: firstname } : {}),
        ...(lastname ? { last_name: lastname } : {}),
        ...(list ? { lists: [list] } : {}),
      },
    });
  },
});
