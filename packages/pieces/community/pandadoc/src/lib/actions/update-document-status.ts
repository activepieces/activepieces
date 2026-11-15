import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const updateDocumentStatus = createAction({
  auth: pandadocAuth,
  name: 'update_document_status',
  classification: 'WRITE',
  displayName: 'Update Document Status',
  description: 'Manually marks a document as completed, paid, voided or declined.',
  audience: 'both',
  aiMetadata: {
    description:
      'Manually change a PandaDoc document status to completed, paid, voided or declined (for example void a sent contract), with an optional private note and optional email to recipients. Only these four targets are allowed by PandaDoc. Idempotent for the same target status.',
    idempotent: true,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
    status: Property.StaticDropdown({
      displayName: 'New Status',
      required: true,
      options: {
        options: [
          { label: 'Completed', value: 2 },
          { label: 'Paid', value: 10 },
          { label: 'Voided', value: 11 },
          { label: 'Declined', value: 12 },
        ],
      },
    }),
    note: Property.LongText({ displayName: 'Private Note', required: false }),
    notify_recipients: Property.Checkbox({ displayName: 'Notify Recipients', required: false, defaultValue: false }),
  },
  outputSchema: pandadocSchemas['statusChange'],
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const documentId = pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' });
    const status = pandadocInputs.optionalNumber(propsValue.status);
    if (status === undefined || !STATUS_NAMES[status]) {
      throw new Error('New Status must be completed, paid, voided or declined.');
    }
    const note = pandadocInputs.optionalString(propsValue.note);
    const before = await pandadocApi.getDocumentStatus({ apiKey, documentId });
    await pandadocApi.changeDocumentStatus({
      apiKey,
      documentId,
      body: { status, notify_recipients: propsValue.notify_recipients === true, ...(note === undefined ? {} : { note }) },
    });
    return { id: documentId, status: STATUS_NAMES[status], previous_status: before.status };
  },
});

const STATUS_NAMES: Record<number, string> = { 2: 'document.completed', 10: 'document.paid', 11: 'document.voided', 12: 'document.declined' };
