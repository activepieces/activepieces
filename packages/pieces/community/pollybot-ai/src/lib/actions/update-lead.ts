import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import {
  baseUrl,
  leadStatusOptions,
  leadPriorityOptions,
  preferredMethodOptions,
  urgencyOptions,
  formatError,
} from '../common/common';

export const updateLead = createAction({
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Updates an existing lead. Supports partial updates.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update an existing lead in the configured PollyBot chatbot. Replaces provided fields, leaves omitted fields intact. Requires at least one field to change.',
    idempotent: true,
  },
  auth: pollybotAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Lead ID',
      required: true,
      description: 'The unique ID of the lead to update.',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
      description: 'The full name of the lead (1-100 characters).',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: 'Valid email address. Must be unique for this chatbot.',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      description: "The lead's phone number (maximum 20 characters).",
    }),
    discord: Property.ShortText({
      displayName: 'Discord',
      required: false,
      description:
        "The lead's Discord username or handle (maximum 50 characters).",
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
      description: 'The company or organization name (maximum 100 characters).',
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: false,
      description:
        'The inquiry or message submitted by the lead (maximum 1000 characters).',
    }),
    preferredMethod: Property.StaticDropdown({
      displayName: 'Preferred Method',
      required: false,
      options: {
        options: Object.entries(preferredMethodOptions).map(
          ([value, label]) => ({ label, value })
        ),
      },
      description: 'The contact method preferred by the lead.',
    }),
    urgency: Property.StaticDropdown({
      displayName: 'Urgency',
      required: false,
      options: {
        options: Object.entries(urgencyOptions).map(([value, label]) => ({
          label,
          value,
        })),
      },
      description: 'The urgency level reported by the lead.',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: Object.entries(leadStatusOptions).map(([value, label]) => ({
          label,
          value,
        })),
      },
      description: 'Update the pipeline status of the lead.',
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        options: Object.entries(leadPriorityOptions).map(([value, label]) => ({
          label,
          value,
        })),
      },
      description: 'Update the priority level of the lead.',
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
      description: 'Internal notes regarding the lead (maximum 2000 characters).' 
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      required: false,
      description: 'Replaces the stored customFields object entirely.',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      description: 'Replaces the stored tags array entirely.',
    }),
  },
  async run({ auth, propsValue }) {
    const { id, ...fieldsToUpdate } = propsValue;

    // Filter out undefined/null/empty to only send requested updates
    const requestBody = Object.fromEntries(
      Object.entries(fieldsToUpdate).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ''
      )
    );

    if (Object.keys(requestBody).length === 0) {
      throw new Error('At least one field must be provided to update.');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${baseUrl}/chatbots/${auth.props.chatbotId}/leads/${id}`,
        headers: {
          Authorization: `Bearer ${auth.props.apiKey}`,
        },
        body: requestBody,
      });
      return response.body.data || response.body;
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
