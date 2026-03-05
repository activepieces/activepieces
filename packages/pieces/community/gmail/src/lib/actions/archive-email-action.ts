import { createAction } from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../auth';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email by removing the INBOX label',
  props: {
    message: GmailProps.message,
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
        removeLabelIds: ['INBOX'],
      },
    });
    return response.body;
  },
});
