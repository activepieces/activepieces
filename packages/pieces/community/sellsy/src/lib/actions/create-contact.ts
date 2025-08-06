import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { contactProps } from '../common/props';

export const createContact = createAction({
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact in Sellsy',
  auth: sellsyAuth,
  props: contactProps,
  async run(context) {
    const { access_token } = context.auth as { access_token: string };

    const contactData = {
      first_name: context.propsValue.firstName,
      last_name: context.propsValue.lastName,
      email: context.propsValue.email,
      phone: context.propsValue.phone,
      company: context.propsValue.company,
      position: context.propsValue.position,
      note: context.propsValue.notes,
    };

    const response = await makeRequest(
      { access_token },
      HttpMethod.POST,
      '/people',
      contactData
    );
    return response;
  },
}); 