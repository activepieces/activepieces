import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { contactIdDropdown } from '../common/props';

export const updateContact = createAction({
  auth: aircallAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact.',
  props: {
    contactId: contactIdDropdown,
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    information: Property.LongText({
      displayName: 'Information',
      description: 'Additional information about the contact',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, first_name, last_name, company_name, information } =
      context.propsValue;
    
    // Prepare request body with only provided fields
    const requestBody: Record<string,any> = {};

    if (first_name) requestBody['first_name'] = first_name;
    if (last_name) requestBody['last_name'] = last_name;
    if (company_name) requestBody['company_name'] = company_name;
    if (information) requestBody['information'] = information;

    const response = await makeRequest(
       context.auth,
      HttpMethod.POST,
      `/contacts/${contactId}`,
      requestBody
    );

    return response;
  },
});
