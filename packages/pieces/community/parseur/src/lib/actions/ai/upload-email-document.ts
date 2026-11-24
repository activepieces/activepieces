import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurApi } from '../../common/api';
import { emailDocumentUploadOutputSchema } from '../../output-schemas';

export const uploadEmailDocumentAction = createAction({
  auth: parseurAuth,
  name: 'parseur_upload_email_document',
  outputSchema: emailDocumentUploadOutputSchema,
  displayName: 'Upload Email Document',
  description: 'Sends an email or text document into a mailbox for parsing.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends an email or plain-text document to a Parseur mailbox, which parses it and uses one credit. The mailbox is picked by Recipient: its email address, "<email_prefix>@in.parseur.com" with email_prefix from Get Mailbox. Returns the new document\'s ID in DocumentID; parsing is asynchronous, so read the result later with Get Document. Every call creates another document.',
    idempotent: false,
  },
  props: {
    recipient: Property.ShortText({
      displayName: 'Recipient',
      description:
        'The mailbox\'s email address, "<email_prefix>@in.parseur.com".',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Sender email address.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The email\'s "To" address.',
      required: false,
    }),
    cc: Property.ShortText({
      displayName: 'CC',
      description: 'The email\'s "CC" addresses.',
      required: false,
    }),
    bcc: Property.ShortText({
      displayName: 'BCC',
      description: 'The email\'s "BCC" addresses.',
      required: false,
    }),
    bodyHtml: Property.LongText({
      displayName: 'Body HTML',
      description: 'HTML body. Set this, Body Plain, or both.',
      required: false,
    }),
    bodyPlain: Property.LongText({
      displayName: 'Body Plain',
      description: 'Plain-text body. Set this, Body HTML, or both.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.bodyHtml && !propsValue.bodyPlain) {
      throw new Error('Set Body HTML, Body Plain, or both.');
    }
    return await parseurApi.createEmailDocument({
      auth,
      document: {
        recipient: propsValue.recipient,
        subject: propsValue.subject,
        from: propsValue.from,
        to: propsValue.to,
        cc: propsValue.cc,
        bcc: propsValue.bcc,
        body_html: propsValue.bodyHtml,
        body_plain: propsValue.bodyPlain,
      },
    });
  },
});
