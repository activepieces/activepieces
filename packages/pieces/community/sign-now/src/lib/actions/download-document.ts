import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const downloadDocumentAction = createAction({
  auth: signNowAuth,
  name: 'download_document',
  displayName: 'Download Document',
  description: 'Downloads a document as a PDF file.',
  audience: 'human',
  classification: 'READ',
  aiMetadata: { idempotent: true },
  outputSchema: signNowSchemas.downloadedFile,
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to download.',
      required: true,
    }),
  },
  async run(context) {
    const { document_id } = context.propsValue;
    const result = await signNowClient.download({
      token: getSignNowBearerToken(context.auth),
      method: 'GET',
      path: `/document/${signNowClient.segment(document_id)}/download`,
      query: { type: 'collapsed' },
      operation: 'download document',
      accept: 'application/pdf',
      timeoutMs: 120_000,
    });
    const fileName = safeFileName(result.fileName ?? `${document_id.trim()}.pdf`);
    const file = await context.files.write({ fileName, data: result.data });
    return { file, fileName };
  },
});

function safeFileName(value: string): string {
  const base = value.split(/[\\/]/).pop()?.trim() ?? '';
  return base === '' || base === '.' || base === '..' ? 'document.pdf' : base;
}
