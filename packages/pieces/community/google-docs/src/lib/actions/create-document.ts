import { createAction } from '@activepieces/pieces-framework';
import { docsCommon, googleDocsAuth, getAccessToken } from '../common';

export const createDocument = createAction({
  auth: googleDocsAuth,
  name: 'create_document',
  description: 'Create a document on Google Docs',
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
