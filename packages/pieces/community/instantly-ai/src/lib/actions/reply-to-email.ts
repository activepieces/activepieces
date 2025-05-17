import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const replyToEmailAction = createAction({
  auth: instantlyAiAuth,
  name: 'reply_to_email',
  displayName: 'Reply to Email',
  description: 'Send a reply to a Unibox email in Instantly',
  props: {
    reply_to_uuid: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID of the email to reply to',
      required: true,
    }),
    eaccount: Property.ShortText({
      displayName: 'Email Account',
      description: 'The email account that will be used to send this email. It has to be an email account connected to your workspace',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject line of the email message',
      required: true,
    }),
    body_html: Property.LongText({
      displayName: 'HTML Body',
      description: 'The HTML body of the reply email',
      required: false,
    }),
    body_text: Property.LongText({
      displayName: 'Text Body',
      description: 'The text body of the reply email',
      required: false,
    }),
    cc_address_email_list: Property.ShortText({
      displayName: 'CC',
      description: 'Comma-separated list of CC email addresses',
      required: false,
    }),
    bcc_address_email_list: Property.ShortText({
      displayName: 'BCC',
      description: 'Comma-separated list of BCC email addresses',
      required: false,
    }),
  },
  async run(context) {
    const {
      reply_to_uuid,
      eaccount,
      subject,
      body_html,
      body_text,
      cc_address_email_list,
      bcc_address_email_list,
    } = context.propsValue;
    const { auth: apiKey } = context;

    // At least one body type is required
    if (!body_html && !body_text) {
      throw new Error('Either HTML body or Text body must be provided');
    }

    const payload: Record<string, unknown> = {
      reply_to_uuid,
      eaccount,
      subject,
      body: {},
    };

    if (body_html) {
      payload['body'] = {
        ...(payload['body'] as object),
        html: body_html
      };
    }

    if (body_text) {
      payload['body'] = {
        ...(payload['body'] as object),
        text: body_text
      };
    }

    if (cc_address_email_list) {
      payload['cc_address_email_list'] = cc_address_email_list;
    }

    if (bcc_address_email_list) {
      payload['bcc_address_email_list'] = bcc_address_email_list;
    }

    return await makeRequest({
      endpoint: `emails/reply`,
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: payload,
    });
  },
});
