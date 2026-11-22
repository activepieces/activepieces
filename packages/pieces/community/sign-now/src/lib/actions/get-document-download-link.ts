import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const getDocumentDownloadLinkAction = createAction({
  auth: signNowAuth,
  name: 'get_document_download_link',
  displayName: 'Get Document Download Link',
  description: 'Creates a temporary link to download a document as a PDF.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Returns a short-lived public URL that downloads the SignNow document as a PDF, including any signatures so far. Anyone with the link can open it until it expires, so only share it with intended recipients. Each call creates a new link but changes nothing else.',
    idempotent: true,
  },
  outputSchema: signNowSchemas.downloadLink,
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to download.',
      required: true,
    }),
  },
  async run(context) {
    const body = await signNowClient.request({
      token: getSignNowBearerToken(context.auth),
      method: 'POST',
      path: `/document/${signNowClient.segment(context.propsValue.document_id)}/download/link`,
      operation: 'get download link',
    });
    return { link: signNowData.textAt({ value: body, key: 'link' }) ?? null };
  },
});
