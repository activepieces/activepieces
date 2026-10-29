import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../../common/auth';
import { pandadocApi } from '../../common/api';
import { pandadocAiProps } from '../../common/ai-props';
import { pandadocInputs } from '../../common/inputs';
import { pandadocSchemas } from '../../common/schemas';

export const downloadDocumentAi = createAction({
  auth: pandadocAuth,
  name: 'download_document',
  classification: 'READ',
  displayName: 'Download Document (AI)',
  description: 'Downloads a document as a PDF file by document ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Download a PandaDoc document as a PDF file that later steps can use. Set Protected Copy for the certified PDF of a completed document (fails if it is not completed). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
    protected_copy: Property.Checkbox({ displayName: 'Protected Copy', required: false, defaultValue: false }),
  },
  outputSchema: pandadocSchemas['aiDownloadedFile'],
  async run({ auth, propsValue, files }) {
    const documentId = pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' });
    const protectedCopy = propsValue.protected_copy === true;
    const result = await pandadocApi.downloadDocument({ apiKey: auth.secret_text, documentId, protectedCopy, query: {} });
    return {
      file: await files.write({ fileName: result.fileName, data: result.data }),
      file_name: result.fileName,
      protected: protectedCopy,
      document_id: documentId,
    };
  },
});
