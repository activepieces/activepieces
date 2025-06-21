import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsheetApiCall } from '../common/client';
import { smartsheetAuth } from '../../index';

export const findRowByQueryAction = createAction({
  auth: smartsheetAuth,
  name: 'find_row_by_query',
  displayName: 'Find Row by Query',
  description: 'Locate a row by ID and retrieve detailed information with customizable parameters.',
  props: {
    sheetId: Property.Number({
      displayName: 'Sheet ID',
      required: true,
    }),
    rowId: Property.Number({
      displayName: 'Row ID',
      required: true,
    }),
    accessApiLevel: Property.Number({
      displayName: 'Access API Level',
      description: 'Allows COMMENTER access for inputs and return values. Default is 0 (VIEWER).',
      required: false,
      defaultValue: 0,
    }),
    include: Property.StaticDropdown({
      displayName: 'Include Elements',
      description: 'Comma-separated list of elements to include in the response.',
      required: false,
      options: {
        options: [
          { label: 'Columns', value: 'columns' },
          { label: 'Filters', value: 'filters' },
        ],
      },
    }),
    exclude: Property.StaticDropdown({
      displayName: 'Exclude Elements',
      description: 'Comma-separated list of element types to exclude from the response.',
      required: false,
      options: {
        options: [
          { label: 'Filtered Out Rows', value: 'filteredOutRows' },
          { label: 'Link In From Cell Details', value: 'linkInFromCellDetails' },
          { label: 'Links Out To Cells Details', value: 'linksOutToCellsDetails' },
          { label: 'Nonexistent Cells', value: 'nonexistentCells' },
        ],
      },
    }),
    level: Property.Number({
      displayName: 'Data Level',
      description: '0: Text format (default), 1: Multi-contact list, 2: Multi-picklist columns.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { sheetId, rowId, accessApiLevel, include, exclude, level } = context.propsValue;
    const { apiKey, region } = context.auth;

    const queryParams: Record<string, string> = {};

    if (accessApiLevel !== undefined) {
      queryParams['accessApiLevel'] = String(accessApiLevel);
    }

    if (Array.isArray(include) && include.length > 0) {
      queryParams['include'] = include.join(',');
    }

    if (Array.isArray(exclude) && exclude.length > 0) {
      queryParams['exclude'] = exclude.join(',');
    }

    if (level !== undefined) {
      queryParams['level'] = String(level);
    }

    const response = await smartsheetApiCall({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.GET,
      resourceUri: `/sheets/${sheetId}/rows/${rowId}`,
      query: queryParams,
    });

    return response;
  },
});
