import { createAction } from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../auth';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_add_label',
  displayName: 'Add Label to Email',
  description: 'Attach a label to an individual email message',
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
        addLabelIds: [context.propsValue.label.id],
      },
    });
    return response.body;
  },
});
