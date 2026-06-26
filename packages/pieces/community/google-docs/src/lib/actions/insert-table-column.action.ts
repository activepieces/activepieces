import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const insertTableColumn = createAction({
  auth: googleDocsAuth,
  name: 'insert_table_column',
  displayName: 'Insert Table Column',
  description: 'Insert a column into an existing table in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts a new column into an existing table in a Google Docs document. The column is inserted to the left or right of the cell identified by rowIndex and columnIndex. Use "insertRight" to control the insertion side. Not idempotent: each call inserts another column.',
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
      description: 'Zero-based row index of the reference cell used to identify the column.',
      required: true,
    }),
    columnIndex: Property.Number({
      displayName: 'Column Index',
      description: 'Zero-based column index of the reference cell.',
      required: true,
    }),
    insertRight: Property.Checkbox({
      displayName: 'Insert to the Right',
      description: 'If true, the new column is inserted to the right of the reference cell; if false, to the left.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { documentId, tableStartIndex, rowIndex, columnIndex, insertRight } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      insertTableColumn: {
        tableCellLocation: {
          tableStartLocation: { index: tableStartIndex },
          rowIndex,
          columnIndex,
        },
        insertRight: insertRight ?? false,
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
        insertRight: insertRight ?? false,
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'insert table column into'));
    }
  },
});
