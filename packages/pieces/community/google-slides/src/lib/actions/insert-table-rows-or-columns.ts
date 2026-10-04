import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesElementRequests, TABLE_DIMENSIONS } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { tableLinesOutputSchema } from '../output-schemas';

export const insertTableRowsOrColumns = createAction({
  auth: googleSlidesAuth,
  name: 'insert_table_rows_or_columns',
  classification: 'WRITE',
  displayName: 'Insert Table Rows or Columns',
  description: 'Add rows or columns to a table, optionally filling one new row or column.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add 1-20 empty rows (Dimension ROW) or columns (COLUMN) to an existing table so that the first new one sits at Position (1-based; leave empty to add at the end), and optionally fill a single new row/column from Values in the same call. Use it to append a data row ("add EMEA, 12, 15"); use Set Element Text to change existing cells. The table objectId comes from Create Table or List Slide Elements. Not idempotent: each call adds more rows or columns.',
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
    position: Property.Number({
      displayName: 'Position',
      description: 'Where the first new row/column goes, starting at 1 (1 = before the first). Leave empty to add at the end.',
      required: false,
    }),
    count: Property.Number({ displayName: 'Count', description: 'How many to add, 1-20. Default 1.', required: false }),
    values: Property.Array({
      displayName: 'Values',
      description: 'Optional cell texts for the new row (left to right) or column (top to bottom). Only with Count 1.',
      required: false,
    }),
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
    const count = slidesRequests.toInteger({ value: propsValue.count, label: 'Count' }) ?? 1;
    const values = readValues(propsValue.values);
    if (count < 1 || count > 20) {
      throw new Error(`Count must be between 1 and 20 (Google's limit per request), got ${count}.`);
    }
    if (values && count !== 1) {
      throw new Error('Values fill one new row or column: set Count to 1, or leave Values empty.');
    }
    const accessToken = await getAccessToken(context.auth);
    const action = `insert table ${dimension === 'ROW' ? 'rows' : 'columns'}`;
    const located = await slidesElements.loadElement({ accessToken, presentationId, objectId: tableObjectId, action });
    slidesElements.requireType({ located, types: ['TABLE'], purpose: 'this action needs a table' });
    const size = slidesElements.tableSize(located.element);
    const { requests, insertedAt } = slidesElementRequests.buildInsertTableLinesRequests({
      tableObjectId,
      dimension,
      rows: size.rows,
      columns: size.columns,
      position,
      count,
      values,
    });
    await slidesElements.applyRequests({ accessToken, presentationId, requests, revisionId: located.revisionId, action });
    return {
      presentationId,
      slideObjectId: located.slideObjectId,
      tableObjectId,
      dimension,
      position: insertedAt,
      count,
      rows: dimension === 'ROW' ? size.rows + count : size.rows,
      columns: dimension === 'COLUMN' ? size.columns + count : size.columns,
    };
  },
});

function readValues(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const items = Array.isArray(value) ? value : [value];
  return items.length === 0 ? undefined : items.map((item) => (item === null || item === undefined ? '' : String(item)));
}
