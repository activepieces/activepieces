import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import { baseUrl, leadStatusOptions, formatError } from '../common/common';

export const updateLead = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Updates an existing lead. Supports partial updates.',
  auth: pollybotAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Lead ID',
      required: true,
      description: 'The unique identifier of the lead to update.',
    }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    source: Property.ShortText({ displayName: 'Source', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: Object.entries(leadStatusOptions).map(([value, label]) => ({ label, value })),
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
      description: 'Update or add custom data. Metadata is merged with existing data.',
    }),
  },
  async run({ auth, propsValue }) {
    const { id, name, email, phone, source, status, metadata } = propsValue;

    // Construct request body - only include provided fields
    const requestBody: Record<string, unknown> = {};

    if (name) requestBody['name'] = name;
    if (email) requestBody['email'] = email;
    if (phone) requestBody['phone'] = phone;
    if (source) requestBody['source'] = source;
    if (status) requestBody['status'] = status;
    if (metadata) requestBody['metadata'] = metadata;

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
