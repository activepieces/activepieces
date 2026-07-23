import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const deleteTableRow = createAction({
  auth: googleDocsAuth,
  name: 'delete_table_row',
  displayName: 'Delete Table Row',
  description: 'Delete a row from a table in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a row from a table in a Google Docs document. The row to delete is addressed by the table\'s start index plus the row and column coordinates of any cell in that row. All three index values (tableStartIndex, rowIndex, columnIndex) must be obtained from Read Document (gdocs_get_document) — they cannot be guessed. Destructive and not idempotent: all content in the row is permanently removed.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to edit.',
      required: true,
    }),
    tableStartIndex: Property.Number({
      displayName: 'Table Start Index',
      description: 'The character index of the start of the table in the document body. Obtain from Read Document (gdocs_get_document) — cannot be guessed.',
      required: true,
    }),
    rowIndex: Property.Number({
      displayName: 'Row Index',
      description: 'Zero-based row index of the row to delete. Obtain from Read Document (gdocs_get_document).',
      required: true,
    }),
    columnIndex: Property.Number({
      displayName: 'Column Index',
      description: 'Zero-based column index of any cell in the row to delete. Obtain from Read Document (gdocs_get_document).',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, tableStartIndex, rowIndex, columnIndex } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      deleteTableRow: {
        tableCellLocation: {
          tableStartLocation: { index: tableStartIndex },
          rowIndex,
          columnIndex,
        },
      },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return { success: true, documentId, tableStartIndex, deletedRowIndex: rowIndex };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'delete the table row from'));
    }
  },
});
