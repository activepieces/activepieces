import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const createAndPopulateTable = createAction({
  auth: googleDocsAuth,
  name: 'create_and_populate_table',
  displayName: 'Create and Populate Table',
  description: 'Insert a table into a Google Docs document and fill its cells with text',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts a new table at the end of a Google Docs document, sized to the supplied 2D array of strings, and writes each value into its cell in one operation — so an agent can drop a fully-populated table without computing cell indices. The column count is the width of the widest row; shorter rows leave their trailing cells empty. Not idempotent: each call adds another table.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to insert the table into.',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Table Data',
      description:
        'A 2D array of strings (rows of columns), e.g. [["Name","Age"],["Alice","30"]]. Each string is written into its matching cell. The table width is the widest row; shorter rows leave trailing cells empty.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, data } = context.propsValue;

    const rowsData = data as unknown;
    if (!Array.isArray(rowsData) || rowsData.length === 0 || !rowsData.every((row) => Array.isArray(row))) {
      throw new Error('Table Data must be a non-empty 2D array of strings (rows of columns).');
    }
    const tableData = rowsData as string[][];
    const rows = tableData.length;
    const columns = Math.max(...tableData.map((row) => row.length));
    if (columns === 0) {
      throw new Error('Table Data rows must contain at least one column.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    // Append at the end of the body so the new table is unambiguously the last
    // one in the document when we read back to resolve its cell indices.
    const insertTableRequest: docs_v1.Schema$Request = {
      insertTable: { rows, columns, endOfSegmentLocation: {} },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [insertTableRequest] },
      });
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'insert a table into'));
    }

    let reloaded: docs_v1.Schema$Document;
    try {
      const response = await docs.documents.get({ documentId });
      reloaded = response.data;
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'read back the new table in'));
    }

    const content = reloaded.body?.content ?? [];
    const tableElement = findLastTable(content);
    if (!tableElement?.table) {
      throw new Error('Could not locate the inserted table when reading the document back.');
    }

    const cellInserts: docs_v1.Schema$Request[] = [];
    const tableRows = tableElement.table.tableRows ?? [];
    for (let r = 0; r < tableRows.length; r++) {
      const cells = tableRows[r].tableCells ?? [];
      for (let c = 0; c < cells.length; c++) {
        const value = tableData[r]?.[c];
        if (value === undefined || value === null || value === '') {
          continue;
        }
        const cellContent = cells[c].content ?? [];
        const firstParagraph = cellContent[0];
        const insertIndex = firstParagraph?.startIndex;
        if (insertIndex === undefined || insertIndex === null) {
          continue;
        }
        cellInserts.push({ insertText: { text: String(value), location: { index: insertIndex } } });
      }
    }

    // Apply highest-index inserts first so earlier (lower) indices stay valid as
    // text shifts the document; each insert below an applied one is unaffected.
    cellInserts.sort((a, b) => (b.insertText?.location?.index ?? 0) - (a.insertText?.location?.index ?? 0));

    if (cellInserts.length > 0) {
      try {
        await docs.documents.batchUpdate({
          documentId,
          requestBody: { requests: cellInserts },
        });
      } catch (error) {
        throw new Error(docsCommon.formatError(error, 'populate the new table in'));
      }
    }

    return {
      success: true,
      documentId,
      rows,
      columns,
      cellsPopulated: cellInserts.length,
    };
  },
});

// The table appended at end-of-body has the greatest startIndex, so the last
// table element in document order is unambiguously the one just inserted.
function findLastTable(
  content: docs_v1.Schema$StructuralElement[]
): docs_v1.Schema$StructuralElement | undefined {
  let match: docs_v1.Schema$StructuralElement | undefined;
  for (const element of content) {
    if (element.table) {
      match = element;
    }
  }
  return match;
}
