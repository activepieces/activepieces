import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import { baseUrl, formatError } from '../common/common';

export const getLead = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'get_Lead',
  displayName: 'Get Lead',
  description: 'Retrieves a specific lead by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single lead from the configured PollyBot chatbot by its unique lead ID. Use when you already have a lead ID and need its current details. Read-only and idempotent.', idempotent: true },
  auth: pollybotAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Lead ID',
      required: true,
      description: 'The unique identifier of the lead to retrieve.',
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/chatbots/${auth.props.chatbotId}/leads/${propsValue.id}`,
        headers: {
          Authorization: `Bearer ${auth.props.apiKey}`,
        },
      });
      return response.body.data || response.body;
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
