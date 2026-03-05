import { createAction } from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../auth';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label',
  displayName: 'Remove Label from Email',
  description: 'Remove a specific label from an email message',
  props: {
    message: GmailProps.message,
    label: GmailProps.label,
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${context.propsValue.message}/modify`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      body: {
        removeLabelIds: [context.propsValue.label.id],
      },
    });
    return response.body;
  },
});
