import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { postmarkAuth } from '../auth';

export const sendEmailAction = createAction({
  name: 'send_email',
  auth:postmarkAuth,
  displayName: 'Send Email',
  description: 'Send a single email through Postmark.',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'Cc',
      description: 'Carbon copy recipients. Maximum 50 addresses.',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'Bcc',
      description: 'Blind carbon copy recipients. Maximum 50 addresses.',
      required: false,
    }),
    htmlBody: Property.LongText({
      displayName: 'HTML Body',
      required: false,
    }),
    textBody: Property.LongText({
      displayName: 'Text Body',
      required: false,
    }),
  },
  async run(context) {
    const { from, to, subject, cc, bcc, htmlBody, textBody } = context.propsValue;

    if (!htmlBody && !textBody) {
      throw new Error('At least one of HTML Body or Text Body must be provided.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.postmarkapp.com/email',
      headers: {
        'X-Postmark-Server-Token': context.auth.secret_text,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: {
        From: from,
        To: to,
        Subject: subject,
        ...(cc && cc.length > 0 ? { Cc: cc.join(',') } : {}),
        ...(bcc && bcc.length > 0 ? { Bcc: bcc.join(',') } : {}),
        HtmlBody: htmlBody,
        TextBody: textBody,
      },
    });
    return response.body;
  },
});
