import { createAction } from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../auth';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_delete_email',
  displayName: 'Delete Email',
  description: 'Move an email to Trash',
  props: {
    message: GmailProps.message,
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${context.propsValue.message}/trash`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
