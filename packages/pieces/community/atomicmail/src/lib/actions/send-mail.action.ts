import { ApFile, createAction, Property } from '@activepieces/pieces-framework';

import { attachmentsFromApFiles } from '../common/attachments';
import { executePreset } from '../common/jmap';
import {
  accountIdProp,
  optionalApiKeyProp,
  projectStoreHintProp,
} from '../common/props';
import {
  assertStoredCredentials,
  createSession,
  normalizeAccountId,
} from '../common/session';

export const sendMailAction = createAction({
  requireAuth: false,
  name: 'send_mail',
  displayName: 'Send Email',
  description: 'Send an email from your inbox. Optional file attachments.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send one email with TO, subject, and body. Optional file attachments use RFC 8620 blob upload. Each call sends a new message — not idempotent.',
    idempotent: false,
  },
  props: {
    store_hint: projectStoreHintProp,
    to: Property.ShortText({
      displayName: 'To',
      description: 'Recipient email address',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Plain-text message body',
      required: true,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'Optional files to attach to the email',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        }),
      },
    }),
    account_id: accountIdProp,
    api_key: optionalApiKeyProp,
  },
  async run(context) {
    const { to, subject, body, attachments } = context.propsValue;
    const accountId = normalizeAccountId(context.propsValue.account_id);
    const inlineKey = context.propsValue.api_key?.trim();
    await assertStoredCredentials(context, accountId, inlineKey || undefined);
    const session = await createSession(context, accountId);

    const attachmentRows = attachments as Array<{ file: ApFile }> | undefined;
    const apFiles = attachmentRows?.map((row) => row.file).filter(Boolean);
    const temp = attachmentsFromApFiles(apFiles);
    try {
      const vars = {
        TO: to.trim(),
        SUBJECT: subject,
        BODY: body,
      };
      const opsFile =
        temp.attachments.length > 0
          ? 'send_mail_blob_attachment.json'
          : 'send_mail.json';
      const result = await executePreset(session, opsFile, vars, {
        attachments: temp.attachments,
      });
      return result.body;
    } finally {
      temp.cleanup();
    }
  },
});
