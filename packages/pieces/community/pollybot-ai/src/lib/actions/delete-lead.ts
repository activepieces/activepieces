import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pollybotAuth } from '../auth';
import { baseUrl, formatError } from '../common/common';

export const deleteLead = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'delete_lead',
  displayName: 'Delete Lead',
  description: 'Permanently deletes a lead from your PollyBot chatbot.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a lead from the configured PollyBot chatbot by its unique lead ID. Use only when a lead should be removed for good; this cannot be undone. Idempotent on the end state once the lead is gone, though a repeat call on a missing ID may error.', idempotent: true },
  auth: pollybotAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Lead ID',
      required: true,
      description: 'The unique identifier of the lead to delete.',
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
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
