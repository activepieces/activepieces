import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import { baseUrl, leadStatusOptions, formatError } from '../common/common';

export const createLead = createAction({
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in your PollyBot chatbot.',
  auth: pollybotAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: "Lead's full name",
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'Valid email address',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      required: false,
      description: 'Lead source (e.g., website, referral)',
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
      defaultValue: 'new',
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
      description:
        'Custom data as JSON object (e.g., {"company": "Tech Corp"})',
    }),
  },
  async run({ auth, propsValue }) {
    const { name, email, phone, source, status, metadata } = propsValue;

    // Construct request body with strict typing
    const requestBody: Record<string, unknown> = { name, email };

    if (phone) requestBody['phone'] = phone;
    if (source) requestBody['source'] = source;
    if (status) requestBody['status'] = status;
    if (metadata) requestBody['metadata'] = metadata;

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
