import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  currencyDropdown,
  dealIdDropdown,
  departmentIdDropdown,
  sourceIdDropdown,
} from '../common/props';

export const updateDeal = createAction({
  auth: teamleaderAuth,
  name: 'updateDeal',
  displayName: 'Update Deal',
  description:
    'Update an existing sales deal in Teamleader with new information and tracking details',
  props: {
    deal_id: dealIdDropdown,
    title: Property.ShortText({
      displayName: 'Deal Title',
      description:
        'Enter a new descriptive title for this deal (e.g., "Software License Renewal")',
      required: false,
    }),
    summary: Property.LongText({
      displayName: 'Deal Summary',
      description:
        'Provide an updated detailed description of the deal, including key requirements and objectives',
      required: false,
    }),
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
    source_id: sourceIdDropdown,

    department_id: departmentIdDropdown,

    responsible_user_id: Property.ShortText({
      displayName: 'Account Manager',
      description:
        'Enter the ID of the team member responsible for managing this deal',
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
        'Enter the updated estimated probability of closing this deal as a decimal (0.0 to 1.0, e.g., 0.75 for 75%)',
      required: false,
    }),
    estimated_closing_date: Property.DateTime({
      displayName: 'Expected Close Date',
      description: 'Update when you expect this deal to close',
      required: false,
    }),

    currency: currencyDropdown,
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      id: propsValue.deal_id,
    };

    // Add optional fields only if they have values
    if (propsValue.title) requestBody['title'] = propsValue.title;
    if (propsValue.summary) requestBody['summary'] = propsValue.summary;
    if (propsValue.source_id) requestBody['source_id'] = propsValue.source_id;
    if (propsValue.department_id)
      requestBody['department_id'] = propsValue.department_id;
    if (propsValue.responsible_user_id)
      requestBody['responsible_user_id'] = propsValue.responsible_user_id;

    if (propsValue.estimated_probability)
      requestBody['estimated_probability'] = propsValue.estimated_probability;
    if (propsValue.estimated_closing_date)
      requestBody['estimated_closing_date'] = propsValue.estimated_closing_date;
    if (propsValue.estimated_value_amount) {
      requestBody['estimated_value'] = {
        amount: propsValue.estimated_value_amount,
        currency: propsValue.estimated_value_currency,
      };
    }
    if (propsValue.currency) {
      requestBody['currency'] = propsValue.currency;
    }

    if (propsValue.customer_type && propsValue.customer_id) {
      requestBody['lead'] = {
        customer: {
          type: propsValue.customer_type,
          id: propsValue.customer_id,
        },
      };

      if (propsValue.contact_person_id) {
        (requestBody['lead'] as any).contact_person_id =
          propsValue.contact_person_id;
      }
    } else if (propsValue.contact_person_id) {
      requestBody['lead'] = {
        contact_person_id: propsValue.contact_person_id,
      };
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/deals.update',
      requestBody
    );

    return {
      status: 'success',
      message: `Deal ${propsValue.deal_id} updated successfully`,
      data: response,
    };
  },
});
