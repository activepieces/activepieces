import { createAction, Property } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { gmailAuth } from '../auth';

export const gmailListThreads = createAction({
  auth: gmailAuth,
  name: 'gmail_list_threads',
  description: 'List recent threads in your Gmail account',
  displayName: 'List Threads',
  props: {
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of threads to return',
      required: false,
      defaultValue: 15,
    }),
  },
  run: async ({ auth, propsValue: { max_results } }) => {
    const response = await GmailRequests.getRecentThreads({
      authentication: auth,
      maxResults: max_results,
    });
    return response.body;
  },
});
