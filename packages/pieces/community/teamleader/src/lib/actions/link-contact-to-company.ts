import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const linkContactToCompany = createAction({
  auth: teamleaderAuth,
  name: 'linkContactToCompany',
  displayName: 'Link Contact to Company',
  description: 'Links a contact to a company with a specified position',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to link',
      required: true,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company to link to',
      required: true,
    }),
    position: Property.ShortText({
      displayName: 'Position',
      description: 'The position of the contact in the company',
      required: false,
    }),
  },
  async run(context) {
    const requestBody = {
      id: context.propsValue.contactId,
      company_id: context.propsValue.companyId,
    };

    // if (context.propsValue.position) {
    //   requestBody['position'] = context.propsValue.position;
    // }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/contacts.linkToCompany',
      requestBody
    );

    return response;
  },
});