import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesElementRequests, TABLE_DIMENSIONS } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { tableLinesOutputSchema } from '../output-schemas';

export const deleteTableRowsOrColumns = createAction({
  auth: googleSlidesAuth,
  name: 'delete_table_rows_or_columns',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Table Rows or Columns',
  description: 'Delete one or more neighbouring rows or columns from a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete Count neighbouring rows (Dimension ROW) or columns (COLUMN) of a table starting at Position (1-based), with their content. It refuses to delete every row or column; use Delete Elements to remove the whole table. Check the row/column numbers with List Slide Elements (tableCells) first. Not idempotent: a repeat deletes the next rows or columns.',
    idempotent: false,
  },
  outputSchema: tableLinesOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    table_object_id: slidesProps.elementIdProp({
      displayName: 'Table Object ID',
      description: 'Object ID of the table (from Create Table, List Slide Elements or Get Presentation Outline).',
    }),
    dimension: slidesProps.enumProp({ displayName: 'Dimension', description: 'ROW or COLUMN.', values: TABLE_DIMENSIONS, required: true }),
    position: Property.Number({ displayName: 'Position', description: 'First row/column to delete, starting at 1.', required: true }),
    count: Property.Number({ displayName: 'Count', description: 'How many neighbouring rows/columns to delete. Default 1.', required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const tableObjectId = slidesElements.readElementId({ value: propsValue.table_object_id, label: 'Table Object ID' });
    const dimension = slidesElements.readEnum({ value: propsValue.dimension, label: 'Dimension', allowed: TABLE_DIMENSIONS });
    if (!slidesElementRequests.isTableDimension(dimension)) {
      throw new Error('Dimension is required: ROW or COLUMN.');
    }
    const position = slidesRequests.toInteger({ value: propsValue.position, label: 'Position' });
    if (position === undefined) {
      throw new Error('Position is required: the first row/column to delete, starting at 1.');
    }
    const count = slidesRequests.toInteger({ value: propsValue.count, label: 'Count' }) ?? 1;
    if (position < 1 || count < 1) {
      throw new Error(`Position and Count start at 1, got position ${position} and count ${count}.`);
    }
    const accessToken = await getAccessToken(context.auth);
    const action = `delete table ${dimension === 'ROW' ? 'rows' : 'columns'}`;
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId: tableObjectId, action });
    slidesElements.requireType({ located, types: ['TABLE'], purpose: 'this action needs a table' });
    const size = slidesElements.tableSize(located.element);
    const requests = slidesElementRequests.buildDeleteTableLinesRequests({
      tableObjectId,
      dimension,
      rows: size.rows,
      columns: size.columns,
      position,
      count,
    });
    await slidesElements.applyRequests({ accessToken, presentationId, requests, revisionId: located.revisionId, action });
    return {
      presentationId,
      slideObjectId: located.slideObjectId,
      tableObjectId,
      dimension,
      position,
      count,
      rows: dimension === 'ROW' ? size.rows - count : size.rows,
      columns: dimension === 'COLUMN' ? size.columns - count : size.columns,
    };
  },
});
