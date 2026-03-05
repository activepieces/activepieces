import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postmarkAuth } from '../auth';
import { postmarkApiRequest } from '../common';

export const sendEmailWithTemplate = createAction({
  auth: postmarkAuth,
  name: 'send_email_with_template',
  displayName: 'Send Email with Template',
  description: 'Send an email using a Postmark template',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Sender email address (must be a confirmed Sender Signature)',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Recipient email addresses (comma-separated)',
      required: true,
    }),
    templateIdOrAlias: Property.ShortText({
      displayName: 'Template ID or Alias',
      description:
        'The numeric ID or string alias of the template to use',
      required: true,
    }),
    templateModel: Property.Json({
      displayName: 'Template Model',
      description:
        'JSON object with template variables (e.g. {"name": "John", "product": "Acme"})',
      required: true,
      defaultValue: {},
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Tag for categorizing this email',
      required: false,
    }),
    messageStream: Property.ShortText({
      displayName: 'Message Stream',
      description: 'Message stream ID (defaults to "outbound")',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      From: context.propsValue.from,
      To: context.propsValue.to,
      TemplateModel: context.propsValue.templateModel,
    };

    const templateValue = context.propsValue.templateIdOrAlias;
    const numericId = Number(templateValue);
    if (!isNaN(numericId) && Number.isInteger(numericId)) {
      body['TemplateId'] = numericId;
    } else {
      body['TemplateAlias'] = templateValue;
    }

    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;
    if (context.propsValue.messageStream)
      body['MessageStream'] = context.propsValue.messageStream;

    return await postmarkApiRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/email/withTemplate',
      body,
    });
  },
});
