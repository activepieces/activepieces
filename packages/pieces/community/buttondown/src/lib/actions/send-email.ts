import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownAuth } from '../auth';
import { buttondownApiRequest } from '../common';

export const sendEmail = createAction({
  auth: buttondownAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send an email/newsletter to your Buttondown subscribers',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the email',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The body of the email (Markdown supported)',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Whether to send immediately or save as draft',
      required: false,
      defaultValue: 'default',
      options: {
        disabled: false,
        options: [
          { label: 'Send Now', value: 'default' },
          { label: 'Draft', value: 'draft' },
        ],
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      subject: context.propsValue.subject,
      body: context.propsValue.body,
    };

    if (context.propsValue.status === 'draft') {
      body.status = 'draft';
    }

    return await buttondownApiRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/emails',
      body,
    });
  },
});
