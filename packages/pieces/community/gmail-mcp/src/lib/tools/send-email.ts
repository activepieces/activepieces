import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { gmailMcpAuth } from "../../index";

export const sendEmailTool = createAction({
  auth: gmailMcpAuth,
  name: "send_email",
  displayName: "Send Email (MCP)",
  description: "Send an email via Gmail API",
  props: {
    to: Property.ShortText({
      displayName: "To",
      description: "Email address of the recipient",
      required: true,
    }),
    subject: Property.ShortText({
      displayName: "Subject",
      description: "Subject of the email",
      required: true,
    }),
    body: Property.LongText({
      displayName: "Body",
      description: "Content of the email",
      required: true,
    }),
  },
  async run(context) {
    const { to, subject, body } = context.propsValue;
    const { access_token } = context.auth;

    // Construct raw email for Gmail API
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body,
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        raw: encodedMessage,
      },
    });

    return response.body;
  },
});
