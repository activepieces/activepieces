import mime from 'mime-types';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { ApFile } from '@activepieces/pieces-framework';

export interface RawMimeAttachment {
  filename?: string;
  content: Buffer;
  contentType?: string;
}

interface BuildRawMessageProps {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  from?: string;
  subject: string;
  bodyType: 'plain_text' | 'html';
  body: string;
  headers?: { key: string; value: string }[];
  attachments?: ({ file: ApFile; name?: string } | RawMimeAttachment)[];
}

function isFileAttachment(
  attachment: { file: ApFile; name?: string } | RawMimeAttachment
): attachment is { file: ApFile; name?: string } {
  return 'file' in attachment;
}

async function buildRawMessage(props: BuildRawMessageProps): Promise<string> {
  const subjectBase64 = Buffer.from(props.subject).toString('base64');
  const mailOptions: Mail.Options = {
    to: props.to && props.to.length > 0 ? props.to.join(', ') : undefined,
    cc: props.cc && props.cc.length > 0 ? props.cc.join(', ') : undefined,
    bcc: props.bcc && props.bcc.length > 0 ? props.bcc.join(', ') : undefined,
    from: props.from,
    subject: `=?UTF-8?B?${subjectBase64}?=`,
    text: props.bodyType === 'plain_text' ? props.body : undefined,
    html: props.bodyType === 'html' ? props.body : undefined,
    attachments: [],
    headers: props.headers,
  };

  if (props.attachments && props.attachments.length > 0) {
    const attachmentOption: Attachment[] = props.attachments.map(
      (attachment) => {
        if (isFileAttachment(attachment)) {
          const { file, name } = attachment;
          const lookupResult = mime.lookup(
            file.extension ? file.extension : ''
          );
          return {
            filename: name ?? file.filename,
            content: file?.base64,
            contentType: lookupResult ? lookupResult : undefined,
            encoding: 'base64',
          };
        }
        return {
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        };
      }
    );
    mailOptions.attachments = attachmentOption;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mail: any = new MailComposer(mailOptions).compile();
  mail.keepBcc = true;
  const mailBody = await mail.build();

  return Buffer.from(mailBody)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export const GmailMime = {
  buildRawMessage,
};
