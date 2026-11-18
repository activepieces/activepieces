import { HttpMethod } from '@activepieces/pieces-common';
import { EmailitAuthInput, emailitClient } from './client';
import { emailitValues } from './values';

function buildBody(input: SendInput): Record<string, unknown> {
  const template = emailitValues.optionalText(input.template);
  const subject = emailitValues.singleLine({ value: input.subject, label: 'Subject' });
  const html = nonBlank(input.html);
  const text = nonBlank(input.text);
  if (subject === undefined && template === undefined) {
    throw new Error('Subject is required unless you send a template.');
  }
  if (html === undefined && text === undefined && template === undefined) {
    throw new Error('Add an email body (HTML or plain text) or a template.');
  }
  const urlAttachments = emailitValues.attachmentsFromUrls(input.attachmentUrls);
  const fileAttachment = emailitValues.attachmentFromFile(input.attachmentFile);
  const attachments = [...urlAttachments, ...(fileAttachment ? [fileAttachment] : [])];
  return emailitValues.compact({
    from: emailitValues.sender({ name: input.fromName, email: input.fromEmail }),
    to: emailitValues.recipients({ value: input.to, label: 'To', required: true }),
    cc: emailitValues.recipients({ value: input.cc, label: 'CC', required: false }),
    bcc: emailitValues.recipients({ value: input.bcc, label: 'BCC', required: false }),
    reply_to: emailitValues.recipients({ value: input.replyTo, label: 'Reply-To', required: false }),
    subject,
    html,
    text,
    template,
    variables: emailitValues.objectInput({ value: input.variables, label: 'Template Variables' }),
    headers: emailitValues.headers(input.headers),
    meta: emailitValues.stringMap({ value: input.meta, label: 'Metadata' }),
    scheduled_at: emailitValues.dateTime(input.scheduledAt),
    tracking: emailitValues.tracking(input.tracking),
    attachments: attachments.length > 0 ? attachments : undefined,
  });
}

async function send({ auth, input }: { auth: EmailitAuthInput; input: SendInput }): Promise<{ status: number; headers: Record<string, unknown>; body: unknown }> {
  const body = buildBody(input);
  const idempotencyKey = emailitValues.idempotencyKey(input.idempotencyKey);
  return emailitClient.send({ auth, method: HttpMethod.POST, path: '/emails', body, idempotencyKey, redactBody: true });
}

function nonBlank(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export const emailitSend = { buildBody, send };

export type SendInput = {
  to: unknown;
  cc?: unknown;
  bcc?: unknown;
  replyTo?: unknown;
  fromName?: unknown;
  fromEmail: unknown;
  subject?: unknown;
  html?: unknown;
  text?: unknown;
  template?: unknown;
  variables?: unknown;
  headers?: unknown;
  meta?: unknown;
  scheduledAt?: unknown;
  tracking?: unknown;
  attachmentUrls?: unknown;
  attachmentFile?: unknown;
  idempotencyKey?: unknown;
};
