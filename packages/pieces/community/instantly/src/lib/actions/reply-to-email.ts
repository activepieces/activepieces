import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { InstantlyCommon } from '../common';
import { instantlyAuth } from '../../index';

export const replyToEmailAction = createAction({
  auth: instantlyAuth,
  name: 'reply_to_email',
  displayName: 'Reply to Email',
  description: 'Send a reply to a Unibox email in Instantly',
  props: {
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID of the email to reply to',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Reply Body',
      description: 'The body of the reply email',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the reply email (optional)',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Email addresses to CC on the reply',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'Email addresses to BCC on the reply',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'URLs of attachments to include with the reply',
      required: false,
    }),
  },
  async run(context) {
    const {
      email_id,
      body,
      subject,
      cc,
      bcc,
      attachments,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const payload: Record<string, unknown> = {
      body,
    };

    if (subject) {
      payload.subject = subject;
    }

    if (cc && cc.length > 0) {
      payload.cc = cc;
    }

    if (bcc && bcc.length > 0) {
      payload.bcc = bcc;
    }

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const response = await InstantlyCommon.makeRequest({
      endpoint: `unibox/emails/${email_id}/reply`,
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: payload,
    });

    return response;
  },
});
