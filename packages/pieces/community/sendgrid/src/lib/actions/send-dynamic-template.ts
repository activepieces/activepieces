import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { sendgridCommon } from '../common';
import { sendgridAuth } from '../..';

export const sendDynamicTemplate = createAction({
  auth: sendgridAuth,
  name: 'send_dynamic_template',
  displayName: 'Send Dynamic Template',
  description: 'Send an email using a dynamic template',
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'Emails of the recipients',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From (Name)',
      description: 'Sender name',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From (Email)',
      description: 'Sender email, must be on your SendGrid',
      required: true,
    }),
    template_id: Property.ShortText({
      displayName: 'Template Id',
      description: 'Dynamic template id',
      required: true,
    }),
    template_data: Property.Json({
      displayName: 'Template Data',
      description: 'Dynamic template data',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Email to receive replies on (defaults to sender)',
      required: false,
    }),
  },
  async run(context) {
    const { to, from, template_id, template_data, reply_to, from_name } =
      context.propsValue;
    const message = {
      personalizations: to.map((email) => ({
        to: [{ email: (email as string).trim() }],
        dynamic_template_data: template_data,
      })),
      from: { email: from, name: from_name },
      reply_to: { email: reply_to ?? from },
      template_id,
    };

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${sendgridCommon.baseUrl}/mail/send`,
      body: message,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      queryParams: {},
    });
    return {
      success: true,
    };
  },
});
