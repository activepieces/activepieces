import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../../common/auth';
import { pandadocApi } from '../../common/api';
import { pandadocAiProps } from '../../common/ai-props';
import { pandadocFiles } from '../../common/files';
import { pandadocInputs } from '../../common/inputs';
import { pandadocNormalize } from '../../common/normalize';
import { pandadocSchemas } from '../../common/schemas';

export const addDocumentAttachmentAi = createAction({
  auth: pandadocAuth,
  name: 'add_document_attachment',
  classification: 'WRITE',
  displayName: 'Add Document Attachment (AI)',
  description: 'Adds an attachment to a document by document ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Attach a file to a PandaDoc document, either from a public URL or from a file produced by an earlier step. Attachments are extra files shown with the document, not pages of it. Not idempotent: each call adds another attachment.',
    idempotent: false,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
    url: Property.ShortText({ displayName: 'File URL', description: 'Public URL of the file. Leave empty when passing File.', required: false }),
    file: Property.File({ displayName: 'File', required: false }),
    name: Property.ShortText({ displayName: 'Attachment Name', required: false }),
  },
  outputSchema: pandadocSchemas['attachment'],
  async run({ auth, propsValue }) {
    const raw = await pandadocApi.createAttachmentRaw({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
      url: pandadocInputs.optionalString(propsValue.url),
      file: pandadocFiles.readUploadFile({ value: propsValue.file, label: 'File' }),
      name: pandadocInputs.optionalString(propsValue.name),
    });
    return pandadocNormalize.attachment(raw);
  },
});
