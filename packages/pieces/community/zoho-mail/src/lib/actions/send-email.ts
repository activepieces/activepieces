import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoMailAuth } from '../../index';
import { zohoMailCommon } from '../common';

export const sendEmail = createAction({
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send an email through Zoho Mail',
  auth: zohoMailAuth,
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'Sender email address',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'CC email addresses',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'BCC email addresses',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject',
      required: true,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'The type of content to send',
      required: true,
      defaultValue: 'html',
      options: {
        options: [
          { label: 'Plain Text', value: 'text' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Email content',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { from, to, cc, bcc, subject, content_type, content } = propsValue;
    const typedAuth = auth as any;
    const region = typedAuth.props?.region;
    const accountId = typedAuth.data?.accountId || 'self';
    
    const requestBody = {
      fromAddress: from,
      toAddress: to.join(','),
      ccAddress: cc ? cc.join(',') : undefined,
      bccAddress: bcc ? bcc.join(',') : undefined,
      subject: subject,
      content: content,
      mailFormat: content_type === 'html' ? 'html' : 'plaintext',
    };
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: zohoMailCommon.getFullUrl(region, accountId, '/messages'),
      headers: zohoMailCommon.authHeaders(typedAuth.access_token),
      body: requestBody,
    });
    
    return response.body;
  },
});