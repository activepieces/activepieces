import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { currencyDropdown } from '../common/props';

export const createDeal = createAction({
  auth: teamleaderAuth,
  name: 'createDeal',
  displayName: 'Create Deal',
  description: 'Create a new deal in Teamleader',
  props: {
    customer_type: Property.StaticDropdown({
      displayName: 'Customer Type',
      description: 'Type of customer for the deal',
      required: true,
      options: {
        options: [
          { label: 'Company', value: 'company' },
          { label: 'Contact', value: 'contact' },
        ],
      },
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The ID of the customer (company or contact) this deal is associated with',
      required: true,
    }),
    contact_person_id: Property.ShortText({
      displayName: 'Contact Person ID',
      description: 'The ID of the contact person for this deal',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the deal',
      required: true,
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'A brief summary of the deal',
      required: false,
    }),
    source_id: Property.ShortText({
      displayName: 'Source ID',
      description: 'The ID of the source this deal is associated with',
      required: true,
    }),

    department_id: Property.ShortText({
      displayName: 'Department ID',
      description: 'The ID of the department this deal is associated with',
      required: false,
    }),
    responsible_user_id: Property.ShortText({
      displayName: 'Responsible User ID',
      description: 'The ID of the user responsible for this deal',
      required: false,
    }),
    phase_id: Property.ShortText({
      displayName: 'Phase ID',
      description: 'The ID of the phase this deal is in',
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
    estimatedClosingDate: Property.DateTime({
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
    const requestBody = {
      lead: {
        customer: {
          tyepe: propsValue.customer_type,
          id: propsValue.customer_id,
        },
        contact_person_id: propsValue.contact_person_id,
      },
      title: propsValue.title,
      summary: propsValue.summary,
      source_id: propsValue.source_id,
      department_id: propsValue.department_id,
      responsible_user_id: propsValue.responsible_user_id,
      phase_id: propsValue.phase_id,
      estimated_value: propsValue.estimated_value,
      estimated_probability: propsValue.estimated_probability,
      estimated_closing_date: propsValue.estimatedClosingDate,
      phase: propsValue.phase,
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/deals.create',
      requestBody
    );

    return response;
  },
});
