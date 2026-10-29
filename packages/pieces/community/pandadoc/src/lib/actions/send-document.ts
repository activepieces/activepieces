import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const sendDocument = createAction({
  auth: pandadocAuth,
  name: 'send_document',
  classification: 'WRITE',
  displayName: 'Send Document',
  description: 'Sends a draft document to its recipients for viewing or signing.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a PandaDoc document that is in draft status to its recipients by email, with an optional subject and message. Silent sends without emailing (useful with signing links). Fails with a conflict if the document is still uploading or already sent. Not idempotent: each call sends again.',
    idempotent: false,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
    subject: Property.ShortText({ displayName: 'Email Subject', required: false }),
    message: Property.LongText({ displayName: 'Email Message', required: false }),
    silent: Property.Checkbox({
      displayName: 'Silent (No Email)',
      description: 'Send without emailing recipients, for example when you share a signing link yourself.',
      required: false,
      defaultValue: false,
    }),
    sender_email: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Email of a workspace member to send as. Leave empty to send as the API key owner.',
      required: false,
    }),
  },
  outputSchema: pandadocSchemas['sentDocument'],
  async run({ auth, propsValue }) {
    const subject = pandadocInputs.optionalString(propsValue.subject);
    const message = pandadocInputs.optionalString(propsValue.message);
    const senderEmail = pandadocInputs.optionalString(propsValue.sender_email);
    return pandadocApi.sendDocument({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
      body: {
        silent: propsValue.silent === true,
        ...(subject === undefined ? {} : { subject }),
        ...(message === undefined ? {} : { message }),
        ...(senderEmail === undefined ? {} : { sender: { email: senderEmail } }),
      },
    });
  },
});
