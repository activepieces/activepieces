import { createAction } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { gmailAuth } from '../auth';

export const gmailListLabels = createAction({
  auth: gmailAuth,
  name: 'gmail_list_labels',
  description: 'List all labels in your Gmail account',
  displayName: 'List Labels',
  props: {},
  run: async ({ auth }) => {
    const response = await GmailRequests.getLabels({ authentication: auth });
    return response.body;
  },
});
