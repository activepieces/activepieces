import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import {
  baseUrl,
  preferredMethodOptions,
  urgencyOptions,
  formatError,
} from '../common/common';

export const createLead = createAction({
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in your PollyBot chatbot.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new lead record under the configured PollyBot chatbot. Requires name. Automatically assigns status NEW and priority MEDIUM.',
    idempotent: false,
  },
  auth: pollybotAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: "Lead's full name (1-100 characters)",
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: 'Valid email address. Must be unique for this chatbot.',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      description: 'The lead\'s phone number (maximum 20 characters).',
    }),
    discord: Property.ShortText({
      displayName: 'Discord',
      required: false,
      description:
        'The lead\'s Discord username or handle (maximum 50 characters).',
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
      defaultValue: 'email',
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
      defaultValue: 'low',
    }),
    source: Property.ShortText({
      displayName: 'Source',
      required: false,
      description:
        'The origin of the lead (maximum 50 characters, defaults to "api").',
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      required: false,
      description:
        'Custom data as a valid JSON object (e.g., {"plan": "enterprise"})',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      description:
        'Tags attached to the lead (maximum 10 tags, each up to 50 characters).',
    }),
  },
  async run({ auth, propsValue }) {
    // Remove undefined values to keep the payload clean
    const requestBody = Object.fromEntries(
      Object.entries(propsValue).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ''
      )
    );

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/chatbots/${auth.props.chatbotId}/leads`,
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
