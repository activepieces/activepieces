import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDeal = createAction({
  auth: teamleaderAuth,
  name: 'createDeal',
  displayName: 'Create Deal',
  description: 'Create a new deal in Teamleader',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the deal',
      required: true,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company this deal is associated with',
      required: true,
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact person for this deal',
      required: false,
    }),
    source: Property.StaticDropdown({
      displayName: 'Source',
      description: 'The source of the deal',
      required: false,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Meeting', value: 'meeting' },
          { label: 'Phone', value: 'phone' },
          { label: 'Website', value: 'website' },
          { label: 'Word of mouth', value: 'word_of_mouth' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    department: Property.ShortText({
      displayName: 'Department ID',
      description: 'The ID of the department this deal is associated with',
      required: false,
    }),
    responsibleUserId: Property.ShortText({
      displayName: 'Responsible User ID',
      description: 'The ID of the user responsible for this deal',
      required: false,
    }),
    estimatedValue: Property.Number({
      displayName: 'Estimated Value',
      description: 'The estimated value of the deal',
      required: false,
    }),
    estimatedProbability: Property.Number({
      displayName: 'Estimated Probability',
      description: 'The estimated probability (0-100) of closing this deal',
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
  async run({auth, propsValue}) {
    const requestBody: Record<string, unknown> = {
      title: propsValue.title,
      company: { type: 'company', id: propsValue.companyId },
    };

    if (propsValue.contactId) {
      requestBody['contact'] = { type: 'contact', id: propsValue.contactId };
    }
    if (propsValue.source) {
      requestBody['source'] = propsValue.source;
    }
    if (propsValue.department) {
      requestBody['department'] = { type: 'department', id: propsValue.department };
    }
    if (propsValue.responsibleUserId) {
      requestBody['responsible_user'] = { type: 'user', id: propsValue.responsibleUserId };
    }
    if (propsValue.estimatedValue) {
      requestBody['estimated_value']   = {
        amount: propsValue.estimatedValue,
        currency: 'EUR' 
      };
    }
    if (propsValue.estimatedProbability) {
      requestBody['estimated_probability'] = propsValue.estimatedProbability;
    }
    if (propsValue.estimatedClosingDate) {
      requestBody['estimated_closing_date'] = propsValue.estimatedClosingDate;
    }
    if (propsValue.phase) {
      requestBody['phase'] = { type: 'dealPhase', id: propsValue.phase };
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/deals.create',
      requestBody
    );

    return response;
  },
});