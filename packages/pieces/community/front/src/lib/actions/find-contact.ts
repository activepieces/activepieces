import { createAction } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props'; 
export const findContact = createAction({
  auth: frontAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Look up a contact by their ID or handle (email, phone, etc.).',
  props: {
    contact_identifier: frontProps.contact({
      displayName: 'Contact', 
    }),
  },
  async run(context) {
    const { contact_identifier } = context.propsValue;
    const token = context.auth;
    return await makeRequest(
      token,
      HttpMethod.GET,
      `/contacts/${contact_identifier}`
    );
  },
});
