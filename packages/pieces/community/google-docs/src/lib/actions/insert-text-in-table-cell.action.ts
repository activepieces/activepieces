import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const insertTextInTableCell = createAction({
  auth: googleDocsAuth,
  name: 'insert_text_in_table_cell',
  displayName: 'Insert Text in Table Cell',
  description: 'Insert text into a specific table cell in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts text at the start of a specific table cell in a Google Docs document. The action reads the document to resolve the correct character index for the target cell, then inserts text there. Requires the table start index (from Read Document — cannot be guessed), plus the zero-based row and column index of the target cell. Not idempotent: each call inserts the text again.',
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
      description: 'Zero-based row index of the target cell.',
      required: true,
    }),
    columnIndex: Property.Number({
      displayName: 'Column Index',
      description: 'Zero-based column index of the target cell.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to insert into the table cell.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, tableStartIndex, rowIndex, columnIndex, text } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    let cellContentIndex: number;
    try {
      const docResponse = await docs.documents.get({ documentId });
      const content = docResponse.data.body?.content ?? [];

      const tableElement = content.find(
        (el) => el.table !== undefined && el.startIndex === tableStartIndex
      );

      if (!tableElement?.table) {
        throw new Error(
          `No table found at start index ${tableStartIndex}. Verify the table start index from Read Document.`
        );
      }

      const tableRows = tableElement.table.tableRows ?? [];
      const targetRow = tableRows[rowIndex];
      if (!targetRow) {
        throw new Error(`Row index ${rowIndex} is out of range — table has ${tableRows.length} row(s).`);
      }

      const targetCell = (targetRow.tableCells ?? [])[columnIndex];
      if (!targetCell) {
        throw new Error(
          `Column index ${columnIndex} is out of range — row has ${(targetRow.tableCells ?? []).length} cell(s).`
        );
      }

      const firstContent = (targetCell.content ?? [])[0];
      if (firstContent?.startIndex === undefined || firstContent.startIndex === null) {
        throw new Error('Could not resolve the content start index for the target cell.');
      }

      cellContentIndex = firstContent.startIndex;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('No table') ||
          error instanceof Error && error.message.startsWith('Row index') ||
          error instanceof Error && error.message.startsWith('Column index') ||
          error instanceof Error && error.message.startsWith('Could not')) {
        throw error;
      }
      throw new Error(docsCommon.formatError(error, 'read'));
    }

    const request: docs_v1.Schema$Request = {
      insertText: {
        text,
        location: { index: cellContentIndex },
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
        insertedAtIndex: cellContentIndex,
        insertedCharacters: text.length,
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'insert text into table cell in'));
    }
  },
});
