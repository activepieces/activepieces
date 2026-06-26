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
      'Inserts a new table sized to the supplied 2D array of strings and writes each value into its cell in one operation, so an agent can drop a fully-populated table without manually computing cell indices. Use when you have tabular data (rows of columns) to add; the table dimensions are inferred from the data. If "index" is omitted the table is appended to the end of the body, otherwise inserted at that character index — obtain a valid index from Get Document End Index. Not idempotent: each call adds another table.',
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
        'A 2D array of strings (rows of columns), e.g. [["Name","Age"],["Alice","30"]]. The table is sized to these dimensions; each string is written into the matching cell. All rows should have the same number of columns.',
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
    const { documentId, data, index } = context.propsValue;

    const rowsData = data as unknown;
    if (!Array.isArray(rowsData) || rowsData.length === 0 || !Array.isArray(rowsData[0])) {
      throw new Error('Table Data must be a non-empty 2D array of strings (rows of columns).');
    }
    const tableData = rowsData as string[][];
    const rows = tableData.length;
    const columns = tableData[0].length;
    if (columns === 0) {
      throw new Error('Table Data rows must contain at least one column.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const insertTableRequest: docs_v1.Schema$Request =
      index === undefined || index === null
        ? { insertTable: { rows, columns, endOfSegmentLocation: {} } }
        : { insertTable: { rows, columns, location: { index } } };

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
    const tableStartThreshold = index === undefined || index === null ? -1 : index;
    const tableElement = findTargetTable(content, tableStartThreshold);
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

// Returns the last table at or after the given start index (the most recently
// inserted one when appending, or the one inserted at an explicit index).
function findTargetTable(
  content: docs_v1.Schema$StructuralElement[],
  startThreshold: number
): docs_v1.Schema$StructuralElement | undefined {
  let match: docs_v1.Schema$StructuralElement | undefined;
  for (const element of content) {
    if (element.table && (element.startIndex ?? 0) >= startThreshold) {
      match = element;
    }
  }
  return match;
}
