import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { companiesIdDropdown, contactIdDropdown } from '../common/props';

export const linkContactToCompany = createAction({
  auth: teamleaderAuth,
  name: 'linkContactToCompany',
  displayName: 'Link Contact to Company',
  description: 'Links a contact to a company with a specified position',
  props: {
    company_id: companiesIdDropdown,
    contact_id: contactIdDropdown,
    position: Property.ShortText({
      displayName: 'Position',
      description: 'The position of the contact in the company',
      required: false,
    }),
    decision_maker: Property.Checkbox({
      displayName: 'Decision Maker',
      description: 'Is the contact a decision maker?',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const requestBody = {
      id: context.propsValue.contact_id,
      company_id: context.propsValue.company_id,
      position: context.propsValue.position,
      decision_maker: context.propsValue.decision_maker,
    };

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/contacts.linkToCompany',
      requestBody
    );

    return {
      status: 'success',
      data: response.data,
      message: `Contact linked to company ${context.propsValue.company_id} successfully`,
    };
  },
});
