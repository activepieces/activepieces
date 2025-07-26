import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  currencyDropdown,
  departmentIdDropdown,
  sourceIdDropdown,
} from '../common/props';

export const createDeal = createAction({
  auth: teamleaderAuth,
  name: 'createDeal',
  displayName: 'Create Deal',
  description:
    'Create a new sales deal in Teamleader with lead information and tracking details',
  props: {
    customer_type: Property.StaticDropdown({
      displayName: 'Customer Type',
      description:
        'Select whether this deal is associated with a company or individual contact',
      required: true,
      options: {
        options: [
          { label: 'Company', value: 'company' },
          { label: 'Individual Contact', value: 'contact' },
        ],
      },
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'Enter the ID of the customer (company or contact) this deal is associated with',
      required: true,
    }),
    contact_person_id: Property.ShortText({
      displayName: 'Contact Person',
      description:
        'Enter the ID of the specific contact person for this deal (optional)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Deal Title',
      description:
        'Enter a descriptive title for this deal (e.g., "Software License Renewal")',
      required: true,
    }),
    summary: Property.LongText({
      displayName: 'Deal Summary',
      description:
        'Provide a detailed description of the deal, including key requirements and objectives',
      required: false,
    }),
    source_id: sourceIdDropdown,
    department_id: departmentIdDropdown,
    responsible_user_id: Property.ShortText({
      displayName: 'Account Manager',
      description:
        'Enter the ID of the team member responsible for managing this deal',
      required: false,
    }),
    phase_id: Property.ShortText({
      displayName: 'Sales Phase',
      description:
        'Enter the ID of the current sales phase (e.g., Prospect, Qualified, Proposal)',
      required: false,
    }),
    estimated_value_amount: Property.Number({
      displayName: 'Amount',
      description: 'Enter the estimated deal value (numeric amount)',
      required: true,
    }),
    estimated_value_currency: currencyDropdown,

    estimated_probability: Property.Number({
      displayName: 'Win Probability (%)',
      description:
        'Enter the estimated probability of closing this deal as a decimal (0.0 to 1.0, e.g., 0.75 for 75%)',
      required: false,
    }),
    estimated_closing_date: Property.DateTime({
      displayName: 'Expected Close Date',
      description: 'Select when you expect this deal to close',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      lead: {
        customer: {
          type: propsValue.customer_type,
          id: propsValue.customer_id,
        },
      },
      title: propsValue.title,
    };

    // Add optional lead fields
    if (propsValue.contact_person_id) {
      (requestBody['lead'] as any).contact_person_id =
        propsValue.contact_person_id;
    }

    // Add optional deal fields
    if (propsValue.summary) requestBody['summary'] = propsValue.summary;
    if (propsValue.source_id) requestBody['source_id'] = propsValue.source_id;
    if (propsValue.department_id)
      requestBody['department_id'] = propsValue.department_id;
    if (propsValue.responsible_user_id)
      requestBody['responsible_user_id'] = propsValue.responsible_user_id;
    if (propsValue.phase_id) requestBody['phase_id'] = propsValue.phase_id;
    if (propsValue.estimated_probability)
      requestBody['estimated_probability'] = propsValue.estimated_probability;
    if (propsValue.estimated_closing_date)
      requestBody['estimated_closing_date'] = propsValue.estimated_closing_date;

    if (
      propsValue.estimated_value_amount &&
      propsValue.estimated_value_currency
    ) {
      requestBody['estimated_value'] = {
        amount: propsValue.estimated_value_amount,
        currency: propsValue.estimated_value_currency,
      };
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/deals.create',
      requestBody
    );

    return {
      status: 'success',
      message: 'Deal created successfully',
      data: response.data,
    };
  },
});
