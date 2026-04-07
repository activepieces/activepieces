import { createAction, Property } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { gmailAuth } from '../auth';

export const gmailListMessages = createAction({
  auth: gmailAuth,
  name: 'gmail_list_messages',
  description: 'List recent messages in your Gmail account',
  displayName: 'List Messages',
  props: {
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of messages to return',
      required: false,
      defaultValue: 20,
    }),
  },
  run: async ({ auth, propsValue: { max_results } }) => {
    const response = await GmailRequests.getRecentMessages({
      authentication: auth,
      maxResults: max_results,
    });
    return response.body;
  },
});
