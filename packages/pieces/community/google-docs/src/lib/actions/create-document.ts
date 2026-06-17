import { createAction } from '@activepieces/pieces-framework';
import { docsCommon } from '../common';
import { googleDocsAuth, getAccessToken } from '../auth';

export const createDocument = createAction({
  auth: googleDocsAuth,
  name: 'create_document',
  description: 'Create a document on Google Docs',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a brand-new Google Docs document with the given title and writes the provided text into it. Use when an agent needs to generate a fresh document from content it has produced; to add to an existing document use Append Text instead. Not idempotent: every call creates a separate new document.',
    idempotent: false,
  },
  displayName: 'Create Document',
  props: {
    title: docsCommon.title,
    body: docsCommon.body,
  },
  async run(context) {
    const accessToken = await getAccessToken(context.auth);
    const document = await docsCommon.createDocument(
      context.propsValue.title,
      accessToken
    );
    const response = await docsCommon.writeToDocument(
      document.documentId,
      context.propsValue.body,
      accessToken
    );

    return response;
  },
});
