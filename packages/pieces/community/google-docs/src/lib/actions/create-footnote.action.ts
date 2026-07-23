import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const createFootnote = createAction({
  auth: googleDocsAuth,
  name: 'create_footnote',
  displayName: 'Create Footnote',
  description: 'Insert a footnote at a character index in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts a footnote at a specific character index inside an existing paragraph in a Google Docs document, or at the end of the body segment if no index is provided. Returns the new footnoteId, which can then be used to insert text into the footnote segment via Insert Text. The index must fall inside an existing paragraph — obtain a valid index from Get Document End Index or Read Document (cannot be guessed). Not idempotent.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to insert a footnote into (from the document URL or Search Documents).',
      required: true,
    }),
    index: Property.Number({
      displayName: 'Index',
      description:
        'Character index inside an existing paragraph where the footnote anchor is inserted. Leave empty to append at the end of the body segment. Obtain a valid index from Get Document End Index or Read Document — cannot be guessed.',
      required: false,
    }),
  },
  async run(context) {
    const { documentId, index } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request =
      index === undefined || index === null
        ? { createFootnote: { endOfSegmentLocation: {} } }
        : { createFootnote: { location: { index } } };

    try {
      const response = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      const footnoteId = response.data.replies?.[0]?.createFootnote?.footnoteId ?? null;
      return { success: true, documentId, footnoteId };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'create the footnote in'));
    }
  },
});
