import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const insertTable = createAction({
  auth: googleDocsAuth,
  name: 'insert_table',
  displayName: 'Insert Table',
  description: 'Insert a new table into a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts a new table with the specified number of rows and columns into a Google Docs document. If "index" is omitted the table is inserted at the end of the document body; if provided the table is inserted at that character index — obtain a valid index from Get Document End Index first. Not idempotent: each call inserts another table.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to insert the table into.',
      required: true,
    }),
    rows: Property.Number({
      displayName: 'Rows',
      description: 'Number of rows in the new table.',
      required: true,
    }),
    columns: Property.Number({
      displayName: 'Columns',
      description: 'Number of columns in the new table.',
      required: true,
    }),
    index: Property.Number({
      displayName: 'Index',
      description:
        'Character index at which to insert the table. Leave empty to append at the end of the document. Obtain a valid index from Get Document End Index.',
      required: false,
    }),
  },
  async run(context) {
    const { documentId, rows, columns, index } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request =
      index === undefined || index === null
        ? { insertTable: { rows, columns, endOfSegmentLocation: {} } }
        : { insertTable: { rows, columns, location: { index } } };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return {
        success: true,
        documentId,
        rows,
        columns,
        mode: index === undefined || index === null ? 'append' : 'insert_at_index',
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'insert table into'));
    }
  },
});
