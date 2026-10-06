import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooProps } from '../../common/props';
import { mailerooSendEmailOutputSchema } from '../../output-schemas';

export const mailerooSendEmail = createAction({
  auth: mailerooAuth,
  name: 'maileroo_send_email',
  outputSchema: mailerooSendEmailOutputSchema,
  displayName: 'Send Email',
  description: 'Sends or schedules a single email with HTML and/or plain text content.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Sends one email, or schedules it with Scheduled At, and returns its reference ID. Supports HTML and plain text, CC, BCC, reply-to, tags, custom headers and tracking. Use maileroo_send_bulk_emails for many personalized recipients. The From address must be on a verified domain; needs a Sending Key connection. Cancel a scheduled send with maileroo_delete_scheduled_email. Not idempotent: each call sends a new email.',
    idempotent: false,
  },
  props: {
    from: Property.ShortText({ displayName: 'From Email', description: 'Sender address on a verified domain.', required: true }),
    from_name: Property.ShortText({ displayName: 'From Name', description: 'Sender display name.', required: false }),
    to: Property.Array({ displayName: 'To', description: 'Recipient email addresses.', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Subject, at most 255 characters.', required: true }),
    html: Property.LongText({ displayName: 'HTML Body', description: 'HTML content. Provide HTML, plain text, or both.', required: false }),
    plain: Property.LongText({ displayName: 'Plain Text Body', description: 'Plain text content. Generated from the HTML when omitted.', required: false }),
    cc: Property.Array({ displayName: 'CC', description: 'Carbon copy addresses.', required: false }),
    bcc: Property.Array({ displayName: 'BCC', description: 'Blind carbon copy addresses.', required: false }),
    reply_to: Property.ShortText({ displayName: 'Reply To', description: 'Address that receives replies.', required: false }),
    tracking: mailerooProps.tracking,
    tags: Property.Json({ displayName: 'Tags', description: 'Key-value tags for categorizing the email, as a JSON object.', required: false }),
    headers: Property.Json({ displayName: 'Custom Headers', description: 'Custom email headers as a JSON object.', required: false }),
    scheduled_at: Property.ShortText({ displayName: 'Scheduled At', description: 'RFC 3339 timestamp such as 2026-12-01T09:00:00Z, or natural language such as "in 2 hours".', required: false }),
    reference_id: Property.ShortText({ displayName: 'Reference ID', description: 'Optional 24-character hexadecimal ID for tracking. Generated when omitted.', required: false }),
  },
  async run(context) {
    const { from, from_name, to, subject, html, plain, cc, bcc, reply_to, tracking, tags, headers, scheduled_at, reference_id } = context.propsValue;
    if (!html && !plain) {
      throw new Error('Provide an HTML Body, a Plain Text Body, or both.');
    }
    const response = await mailerooClient.emailRequest<{ reference_id: string }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/emails',
      body: {
        from: { address: from, ...spreadIfDefined('display_name', from_name) },
        to: mailerooClient.toStrings(to).map((address) => ({ address })),
        subject,
        ...spreadIfDefined('html', html),
        ...spreadIfDefined('plain', plain),
        ...spreadIfDefined('cc', cc && cc.length > 0 ? mailerooClient.toStrings(cc).map((address) => ({ address })) : undefined),
        ...spreadIfDefined('bcc', bcc && bcc.length > 0 ? mailerooClient.toStrings(bcc).map((address) => ({ address })) : undefined),
        ...spreadIfDefined('reply_to', reply_to ? [{ address: reply_to }] : undefined),
        ...spreadIfDefined('tracking', mailerooClient.optionalBoolean(tracking)),
        ...spreadIfDefined('tags', tags),
        ...spreadIfDefined('headers', headers),
        ...spreadIfDefined('scheduled_at', scheduled_at),
        ...spreadIfDefined('reference_id', reference_id),
      },
    });
    return { message: response.message, reference_id: response.data.reference_id };
  },
});
