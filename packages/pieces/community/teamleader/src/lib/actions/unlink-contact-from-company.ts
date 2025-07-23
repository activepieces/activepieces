import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unlinkContactFromCompany = createAction({
  auth: teamleaderAuth,
  name: 'unlinkContactFromCompany',
  displayName: 'Unlink Contact from Company',
  description: 'Unlinks a contact from a company',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to unlink',
      required: true,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company to unlink from',
      required: true,
    }),
  },
  async run(context) {
    const requestBody = {
      id: context.propsValue.contactId,
      company_id: context.propsValue.companyId,
    };

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/contacts.unlinkFromCompany',
      requestBody
    );

    return response;
  },
});