import { createAction, Property } from '@activepieces/pieces-framework';
import { sendfoxAuth } from '../auth';
import { callsendfoxApi, sendfoxCommon } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
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
    list: sendfoxCommon.lists,
  },
  async run(context) {
    const authentication = context.auth;
    const accessToken = authentication.secret_text;
    const email = context.propsValue.email;
    const firstname = context.propsValue.firstname;
    const lastname = context.propsValue.lastname;
    const list = context.propsValue.list;

    const request_body: { [key: string]: any } = { email: email };
    if (firstname) request_body['first_name'] = firstname;
    if (lastname) request_body['last_name'] = lastname;
    if (list) request_body['lists'] = [list];

    const response = (
      await callsendfoxApi(
        HttpMethod.POST,
        'contacts',
        accessToken,  
        request_body
      )
    ).body;
    return response;
  },
});
