import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { mailjetAuth } from '../../';

export const sendEmail = createAction({
  auth: mailjetAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a text, HTML or template email through Mailjet',
  props: {
    fromEmail: Property.ShortText({
      displayName: 'From (Email)',
      description: 'Sender email, must be verified in Mailjet',
      required: true
    }),
    fromName: Property.ShortText({
      displayName: 'From (Name)',
      required: false
    }),
    toEmails: Property.Array({
      displayName: 'Emails of recipients',
      required: true
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: undefined,
      required: true
    }),
    textPart: Property.LongText({
      displayName: 'Text part',
      description: undefined,
      required: false
    }),
    htmlPart: Property.LongText({
      displayName: 'HTML part',
      description: undefined,
      required: false
    }),
    templateId: Property.Number({
      displayName: 'Template Id',
      description: 'Template Id (number) defined in Mailjet',
      required: false
    }),
    templateVariables: Property.Object({
      displayName: 'Template variables',
      description: undefined,
      required: false
    })
  },
  async run(configValue) {
    const { propsValue, auth } = configValue;

    const message = {
      From: {
        Email: propsValue.fromEmail,
        Name: propsValue.fromName || propsValue.fromEmail
      },
      To: propsValue.toEmails.map(to => ({
        Email: to,
        Name: to
      })),
      Subject: propsValue.subject,
      TextPart: propsValue.textPart,
      TemplateID: propsValue.templateId,
      TemplateLanguage: !!propsValue.templateId,
      Variables: propsValue.templateVariables
    };
    const request: HttpRequest<string> = {
      method: HttpMethod.POST,
      url: `https://api.mailjet.com/v3.1/send`,
      body: JSON.stringify({ messages: [message] }),
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.username,
        password: auth.password
      },
      queryParams: {}
    };

    const response = await httpClient.sendRequest(request);

    if (response.status !== 200) {
      throw new Error(`Failed to communicate with Mailjet`);
    } else {
      return response.body.Messages[0];
    }
  }
});
