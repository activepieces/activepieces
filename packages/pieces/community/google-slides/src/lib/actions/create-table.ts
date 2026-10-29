import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { createTableOutputSchema } from '../output-schemas';

export const createTable = createAction({
  auth: googleSlidesAuth,
  name: 'create_table',
  classification: 'WRITE',
  displayName: 'Create Table',
  description: 'Add a table to a slide, optionally filled from a 2D array with a styled header row.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add a table to one slide and fill it in the same call from Data, a JSON array of rows (e.g. [["Region","Q1"],["EMEA","12"]]); Rows/Columns default to the size of Data. Optionally bold and colour the first (header) row, and place it with X/Y and Width/Height in points (both pairs optional). Use Set Element Text with Row/Column to change one cell later, and Insert/Delete Table Rows or Columns to change its size. Returns the tableObjectId. Not idempotent: each call adds another table.',
    idempotent: false,
  },
  outputSchema: createTableOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    data: Property.Json({
      displayName: 'Data',
      description: 'Optional JSON array of rows, each an array of cell values, e.g. [["Name","Score"],["Ann",9]].',
      required: false,
    }),
    rows: Property.Number({ displayName: 'Rows', description: 'Number of rows. Leave empty to use the number of rows in Data.', required: false }),
    columns: Property.Number({
      displayName: 'Columns',
      description: 'Number of columns. Leave empty to use the longest row in Data.',
      required: false,
    }),
    header_bold: Property.Checkbox({ displayName: 'Bold Header Row', description: 'Make the text of the first row bold.', required: false }),
    header_fill_color: slidesProps.colorProp({
      displayName: 'Header Fill Color',
      description: 'Optional hex background colour for the first row, e.g. #E8F0FE.',
    }),
    x: slidesProps.pointProp({ displayName: 'X (pt)', description: 'Distance from the left edge, in points. Set together with Y.', required: false }),
    y: slidesProps.pointProp({ displayName: 'Y (pt)', description: 'Distance from the top edge, in points. Set together with X.', required: false }),
    width: slidesProps.pointProp({ displayName: 'Width (pt)', description: 'Table width in points. Set together with Height.', required: false }),
    height: slidesProps.pointProp({ displayName: 'Height (pt)', description: 'Table height in points. Set together with Width.', required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: propsValue.slide_number,
      slideObjectId: propsValue.slide_object_id,
    });
    const data = slidesElementRequests.readTableData(propsValue.data);
    const size = slidesElementRequests.resolveTableSize({
      rows: slidesRequests.toInteger({ value: propsValue.rows, label: 'Rows' }),
      columns: slidesRequests.toInteger({ value: propsValue.columns, label: 'Columns' }),
      data,
    });
    const box = slidesElements.readBox({ x: propsValue.x, y: propsValue.y, width: propsValue.width, height: propsValue.height, required: false });
    const headerFill = slidesElements.readColor({ value: propsValue.header_fill_color, label: 'Header Fill Color' });
    if (headerFill?.kind === 'none') {
      throw new Error('Header Fill Color must be a hex colour like #E8F0FE; leave it empty for no fill.');
    }
    const headerBold = slidesElements.readBoolean({ value: propsValue.header_bold, label: 'Bold Header Row' }) ?? false;
    const objectId = slidesIds.generateObjectId('table');
    const accessToken = await getAccessToken(context.auth);
    const action = 'create the table';
    const { objectId: slideObjectId, revisionId } = await slidesRequests
      .lookupSlide({ accessToken, presentationId, selector })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const { requests, filledCells } = slidesElementRequests.buildCreateTableRequests({
      objectId,
      slideObjectId,
      rows: size.rows,
      columns: size.columns,
      data: data ?? [],
      box,
      headerBold,
      headerFill: headerFill?.kind === 'rgb' ? headerFill.rgbColor : undefined,
    });
    await slidesElements.applyRequests({ accessToken, presentationId, requests, revisionId, action });
    return {
      presentationId,
      slideObjectId,
      tableObjectId: objectId,
      rows: size.rows,
      columns: size.columns,
      filledCells,
    };
  },
});
