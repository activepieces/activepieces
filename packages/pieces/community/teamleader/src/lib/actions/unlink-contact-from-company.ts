import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  companiesIdDropdown,
  companiesLinkedContactsDropdown,
  contactIdDropdown,
} from '../common/props';

export const unlinkContactFromCompany = createAction({
  auth: teamleaderAuth,
  name: 'unlinkContactFromCompany',
  displayName: 'Unlink Contact from Company',
  description: 'Unlinks a contact from a company',
  props: {
    contact_id: contactIdDropdown,
    company_id: companiesLinkedContactsDropdown,
  },
  async run({ auth, propsValue }) {
    const requestBody = {
      id: propsValue.contact_id,
      company_id: propsValue.company_id,
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/contacts.unlinkFromCompany',
      requestBody
    );

    return {
      status: 'success',
      data: response.data,
      message: `Contact ${propsValue.contact_id} unlinked from company ${propsValue.company_id} successfully`,
    };
  },
});
