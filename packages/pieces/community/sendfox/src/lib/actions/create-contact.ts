import { createAction, Property } from '@activepieces/pieces-framework';
import { sendfoxAuth } from '../../index';
import { callsendfoxApi, sendfoxCommon } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  name: 'create-contact',
  auth: sendfoxAuth,
  displayName: 'Create Contact',
  description: 'Create a new contact',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstname: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    list: sendfoxCommon.lists,
  },
  async run(context) {
    const authentication = context.auth;
    const accessToken = authentication;
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
