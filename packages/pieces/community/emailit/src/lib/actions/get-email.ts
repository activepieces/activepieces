import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';

export const getEmailAction = createAction({
  auth: emailitAuth,
  name: 'get_email',
  displayName: 'Get Email',
  description: 'Get one sent or received email with its status, headers, body and attachment list.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Emailit email by ID: status (accepted, delivered, bounced, …), from, to, subject, metadata, headers, HTML/text body and attachment names and sizes. Attachment contents are not returned. Read-only; needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.email,
  props: {
    email_id: emailitProps.emailId(),
  },
  async run({ auth, propsValue }) {
    try {
      const email = await emailitClient.request({ auth, method: HttpMethod.GET, path: `/emails/${emailitClient.seg({ value: propsValue.email_id, label: 'Email ID' })}` });
      return withoutAttachmentContent(email);
    } catch (error) {
      return emailitClient.rethrowWithHint({ error, hints: { 404: 'Email not found.' } });
    }
  },
});

function withoutAttachmentContent(email: unknown): unknown {
  if (!emailitClient.isRecord(email)) return email;
  const attachments = email['attachments'];
  if (!Array.isArray(attachments)) return email;
  return {
    ...email,
    attachments: attachments.map((item) =>
      emailitClient.isRecord(item) ? Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'content')) : item,
    ),
  };
}
