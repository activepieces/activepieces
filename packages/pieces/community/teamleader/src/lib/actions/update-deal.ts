import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  companiesIdDropdown,
  contactIdDropdown,
  currencyDropdown,
  dealIdDropdown,
  departmentIdDropdown,
  sourceIdDropdown,
} from '../common/props';

export const updateDeal = createAction({
  auth: teamleaderAuth,
  name: 'updateDeal',
  displayName: 'Update Deal',
  description: 'Update an existing deal in Teamleader',
  props: {
    deal_id: dealIdDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the deal',
      required: false,
    }),
    summary: Property.ShortText({
      displayName: 'Summary',
      description: 'A brief summary of the deal',
      required: false,
    }),
    company_id: companiesIdDropdown,
    contact_id: contactIdDropdown,
    source_id: sourceIdDropdown,
    department_id: departmentIdDropdown,
    responsible_user_id: Property.ShortText({
      displayName: 'Responsible User ID',
      description: 'The ID of the user responsible for this deal',
      required: false,
    }),
    estimated_value: Property.Array({
      displayName: 'Estimated Value',
      description: 'The estimated value of the deal',
      required: false,
      properties: {
        amount: Property.Number({
          displayName: 'Amount',
          description: 'The amount of the estimated value',
          required: true,
        }),
        currency: currencyDropdown,
      },
    }),
    estimated_probability: Property.Number({
      displayName: 'Estimated Probability',
      description:
        'The estimated probability 0 and 1 (inclusive) e.g 0.75 of closing this deal',
      required: false,
    }),
    estimated_closing_date: Property.DateTime({
      displayName: 'Estimated Closing Date',
      description: 'The estimated closing date for this deal',
      required: false,
    }),
    phase: Property.ShortText({
      displayName: 'Phase ID',
      description: 'The ID of the phase this deal is in',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      id: propsValue.deal_id,
    };

    const optionalFields = {
      title: propsValue.title,
      summary: propsValue.summary,
      company_id: propsValue.company_id,
      contact_id: propsValue.contact_id,
      source_id: propsValue.source_id,
      department_id: propsValue.department_id,
      responsible_user_id: propsValue.responsible_user_id,
      estimated_value: propsValue.estimated_value,
      estimated_probability: propsValue.estimated_probability,
      estimated_closing_date: propsValue.estimated_closing_date,
      phase: propsValue.phase,
    };

    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value !== undefined) {
        requestBody[key] = value;
      }
    });

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/deals.update',
      requestBody
    );

    return response;
  },
});
