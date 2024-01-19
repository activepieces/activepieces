import { createAction } from '@activepieces/pieces-framework';
import { docsCommon } from '../common';
import { googleDocsAuth } from '../..';

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
    const document = await docsCommon.createDocument(
      context.propsValue.title,
      context.auth.access_token
    );
    const response = await docsCommon.writeToDocument(
      document.documentId,
      context.propsValue.body,
      context.auth.access_token
    );

    return response;
  },
});
