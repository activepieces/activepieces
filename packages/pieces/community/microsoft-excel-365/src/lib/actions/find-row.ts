import {
  createAction,
  Property,
  OAuth2PropertyValue
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const findRowAction = createAction({
  auth: excelAuth,
  name: 'find_row',
  displayName: 'Find Row',
  description:
    'Locate a row by specifying a lookup column and value (e.g. find a row where “ID” = 123).',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    lookup_column: Property.Dropdown({
      auth: excelAuth,
      displayName: 'Lookup Column',
      description: 'The column to search in.',
      required: true,
      refreshers: ['storageSource', 'siteId', 'documentId', 'workbookId', 'tableId'],
      options: async ({ auth, storageSource, siteId, documentId, workbookId, tableId }) => {
        if (!auth || !workbookId || !tableId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a workbook and table first.'
          };
        }
        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please select SharePoint site and document library first.'
          };
        }
        const authProp = auth as OAuth2PropertyValue;
        const drivePath = getDrivePath(storageSource as string, siteId as string, documentId as string);
        const response = await httpClient.sendRequest<{
          value: { id: string; name: string }[];
        }>({
          method: HttpMethod.GET,
          url: `${drivePath}/items/${workbookId}/workbook/tables/${tableId}/columns`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token
          }
        });

        return {
          disabled: false,
          options: response.body.value.map((column) => ({
            label: column.name,
            value: column.id
          }))
        };
      }
    }),
    lookup_value: Property.ShortText({
      displayName: 'Lookup Value',
      description: 'The value to find in the lookup column.',
      required: true
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, tableId, lookup_column, lookup_value } =
      context.propsValue;
    const { access_token } = context.auth;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
    const columnId = lookup_column;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const sanitizedValue = (lookup_value as string).replace(/'/g, "''");

    const client = createMSGraphClient(access_token, cloud);

    // Define the URL to clear the filter, which will be used in the 'finally' block
    const clearFilterUrl = `${drivePath}/items/${workbookId}/workbook/tables/${tableId}/columns/${columnId}/filter/clear`;

    try {
      // Step 1: Apply the filter to the specified column
      await client
        .api(`${drivePath}/items/${workbookId}/workbook/tables/${tableId}/columns/${columnId}/filter/apply`)
        .post({ criteria: { criterion1: `=${sanitizedValue}`, filterOn: 'Custom' } });

      // Step 2: Get the visible rows (i.e., the filtered results)
      const foundRowsResponse = await client
        .api(`${drivePath}/items/${workbookId}/workbook/tables/${tableId}/range/visibleView/rows`)
        .get();

      // The result is the array of rows that matched the filter
      return foundRowsResponse.value;
    } finally {
      // Step 3: Clear the filter to restore the table to its original state.
      // This runs regardless of whether the previous steps succeeded or failed.
      await client.api(clearFilterUrl).post({});
    }
  }
});
