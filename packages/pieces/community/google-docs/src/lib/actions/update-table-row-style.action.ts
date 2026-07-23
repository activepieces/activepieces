import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const updateTableRowStyle = createAction({
  auth: googleDocsAuth,
  name: 'update_table_row_style',
  displayName: 'Update Table Row Style',
  description: 'Update style properties of one or more rows in a Google Docs table',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates the minimum height of one or more rows in a Google Docs table. Requires the table start index from Read Document — cannot be guessed. (Google Docs does not support toggling a header row via this request.) Idempotent: applying the same height again is a no-op.',
    idempotent: true,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document containing the table.',
      required: true,
    }),
    tableStartIndex: Property.Number({
      displayName: 'Table Start Index',
      description: 'Obtain the table start index from Read Document — cannot be guessed.',
      required: true,
    }),
    rowIndices: Property.Array({
      displayName: 'Row Indices',
      description: 'Zero-based indices of the rows to update (e.g. [0, 1] to update the first two rows).',
      required: true,
    }),
    minRowHeightPt: Property.Number({
      displayName: 'Minimum Row Height (points)',
      description: 'Minimum height of each selected row, in points.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, tableStartIndex, rowIndices, minRowHeightPt } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const rowIndexNumbers = (rowIndices as unknown[]).map((v) => Number(v));

    const request: docs_v1.Schema$Request = {
      updateTableRowStyle: {
        tableStartLocation: { index: tableStartIndex },
        rowIndices: rowIndexNumbers,
        tableRowStyle: { minRowHeight: { magnitude: minRowHeightPt, unit: 'PT' } },
        fields: 'minRowHeight',
      },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return {
        success: true,
        documentId,
        tableStartIndex,
        rowIndices: rowIndexNumbers,
        updatedFields: ['minRowHeight'],
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'update table row style in'));
    }
  },
});
