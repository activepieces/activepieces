import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const sendDocumentReminder = createAction({
  auth: pandadocAuth,
  name: 'send_document_reminder',
  classification: 'WRITE',
  displayName: 'Send Document Reminder',
  description: 'Emails a reminder to recipients who have not yet completed a sent document.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a manual reminder email for a sent PandaDoc document. With no recipient IDs it reminds every recipient who has not finished; otherwise only the listed recipient IDs (from Get Document). Per-recipient results tell you who was reminded. Not idempotent: each call emails again.',
    idempotent: false,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
    recipient_ids: Property.Array({ displayName: 'Recipient IDs', description: 'Leave empty to remind all pending recipients.', required: false }),
    subject: Property.ShortText({ displayName: 'Email Subject', required: false }),
    message: Property.LongText({ displayName: 'Email Message', required: false }),
  },
  outputSchema: pandadocSchemas['reminder'],
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const documentId = pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' });
    const subject = pandadocInputs.optionalString(propsValue.subject);
    const message = pandadocInputs.optionalString(propsValue.message);
    const explicit = pandadocInputs.stringList(propsValue.recipient_ids);
    const recipientIds =
      explicit.length > 0
        ? explicit
        : (await pandadocApi.getDocumentDetails({ apiKey, documentId })).recipients.flatMap((recipient) =>
            recipient.id !== null && recipient.has_completed !== true && recipient.recipient_type !== 'CC' ? [recipient.id] : [],
          );
    if (recipientIds.length === 0) {
      throw new Error('No pending recipients to remind on this document.');
    }
    const customization = subject === undefined && message === undefined ? {} : { email_customization: { ...(subject === undefined ? {} : { subject }), ...(message === undefined ? {} : { message }) } };
    return pandadocApi.sendReminder({
      apiKey,
      documentId,
      body: { reminders: recipientIds.map((recipientId) => ({ recipient_id: recipientId, delivery_methods: { email: true, sms: false }, ...customization })) },
    });
  },
});
