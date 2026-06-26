import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const unmergeTableCells = createAction({
  auth: googleDocsAuth,
  name: 'unmerge_table_cells',
  displayName: 'Unmerge Table Cells',
  description: 'Unmerge previously merged table cells in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unmerges a range of previously merged table cells in a Google Docs document. The range is specified by the anchor cell (rowIndex, columnIndex) and the span (rowSpan, columnSpan) to unmerge. Requires the table start index from Read Document — cannot be guessed. Idempotent: unmerging already-unmerged cells is a no-op.',
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
    rowIndex: Property.Number({
      displayName: 'Row Index',
      description: 'Zero-based row index of the top-left anchor cell of the merged region.',
      required: true,
    }),
    columnIndex: Property.Number({
      displayName: 'Column Index',
      description: 'Zero-based column index of the top-left anchor cell of the merged region.',
      required: true,
    }),
    rowSpan: Property.Number({
      displayName: 'Row Span',
      description: 'Number of rows covered by the merged region to unmerge.',
      required: true,
    }),
    columnSpan: Property.Number({
      displayName: 'Column Span',
      description: 'Number of columns covered by the merged region to unmerge.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, tableStartIndex, rowIndex, columnIndex, rowSpan, columnSpan } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      unmergeTableCells: {
        tableRange: {
          tableCellLocation: {
            tableStartLocation: { index: tableStartIndex },
            rowIndex,
            columnIndex,
          },
          rowSpan,
          columnSpan,
        },
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
        rowIndex,
        columnIndex,
        rowSpan,
        columnSpan,
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'unmerge table cells in'));
    }
  },
});
