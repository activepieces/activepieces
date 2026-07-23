import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const deleteContentRange = createAction({
  auth: googleDocsAuth,
  name: 'delete_content_range',
  displayName: 'Delete Content Range',
  description: 'Delete a range of content from a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes all content between a start and end character index in a Google Docs document body. Obtain valid indices from Get Document End Index / Read Document first — indices cannot be guessed. Note that every Google Docs segment ends in a newline that cannot be deleted, so the end index must not exceed the body end index minus one. Destructive and not idempotent.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to edit.',
      required: true,
    }),
    startIndex: Property.Number({
      displayName: 'Start Index',
      description: 'Inclusive start character index. Obtain from Get Document End Index / Read Document.',
      required: true,
    }),
    endIndex: Property.Number({
      displayName: 'End Index',
      description: 'Exclusive end character index. Must be greater than Start Index and not exceed the body end index.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, startIndex, endIndex } = context.propsValue;
    if (endIndex <= startIndex) {
      throw new Error('End Index must be greater than Start Index.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      deleteContentRange: { range: { startIndex, endIndex } },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return { success: true, documentId, deletedFrom: startIndex, deletedTo: endIndex };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'delete content from'));
    }
  },
});
