import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const insertTableRow = createAction({
  auth: googleDocsAuth,
  name: 'insert_table_row',
  displayName: 'Insert Table Row',
  description: 'Insert a row into an existing table in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts a new row into an existing table in a Google Docs document. The row is inserted above or below the cell identified by rowIndex and columnIndex. Use "insertBelow" to control the insertion side. Not idempotent: each call inserts another row.',
    idempotent: false,
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
      description: 'Zero-based row index of the reference cell used to identify the row.',
      required: true,
    }),
    columnIndex: Property.Number({
      displayName: 'Column Index',
      description: 'Zero-based column index of the reference cell.',
      required: true,
    }),
    insertBelow: Property.Checkbox({
      displayName: 'Insert Below',
      description: 'If true, the new row is inserted below the reference cell; if false, above.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { documentId, tableStartIndex, rowIndex, columnIndex, insertBelow } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      insertTableRow: {
        tableCellLocation: {
          tableStartLocation: { index: tableStartIndex },
          rowIndex,
          columnIndex,
        },
        insertBelow: insertBelow ?? false,
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
        insertBelow: insertBelow ?? false,
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'insert table row into'));
    }
  },
});
