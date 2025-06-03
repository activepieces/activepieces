import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL, outlookAuth } from '../common/common';

export const sendEmail = createAction({
  auth: outlookAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send an email using Microsoft Outlook',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'Recipient email address',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Email body (HTML or plain text)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const requestBody = {
      message: {
        toRecipients: [
          {
            emailAddress: {
              address: propsValue.to,
            },
          },
        ],
        subject: propsValue.subject,
        body: {
          contentType: 'HTML',
          content: propsValue.body,
        },
      },
      saveToSentItems: 'true',
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${BASE_URL}/me/sendMail`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
      responseType: 'json',
    };

    const response = await httpClient.sendRequest(request);
    return response.status;
  },
});
