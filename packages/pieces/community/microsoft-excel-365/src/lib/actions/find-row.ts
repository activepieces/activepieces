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
import { getGraphBaseUrl } from '../common/microsoft-cloud';

export const findRowAction = createAction({
  auth: excelAuth,
  name: 'find_row',
  classification: 'SEARCH',
  displayName: 'Find Row',
  description: 'Filter a table by a column you pick and return the matching rows.',
  audience: 'both',
  aiMetadata: { description: 'Search a table for rows where a chosen column matches a given value, returning the matching rows. Pick this to look up rows by content rather than position (use Get Row by ID when the index is known). Applies a temporary column filter and clears it afterward; read-only with respect to data and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId', 'tableId']
    },
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['lookup_column', 'lookup_value']
    }
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    lookup_column: Property.Dropdown({
      auth: excelAuth,
      displayName: 'Column',
      required: true,
      refreshers: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId', 'tableId'],
      options: async ({ auth, storageSource, siteId, documentId, workbookId, tableId }) => {
        if (!auth || !workbookId || !tableId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Choose a workbook and table first.'
          };
        }
        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Choose a SharePoint site and document library first.'
          };
        }
        const authProp = auth as OAuth2PropertyValue;
        const drivePath = getDrivePath(storageSource as string, siteId as string, documentId as string);
        const response = await httpClient.sendRequest<{
          value: { id: string; name: string }[];
        }>({
          method: HttpMethod.GET,
          url: `${getGraphBaseUrl(authProp.props?.['cloud'])}/v1.0${drivePath}/items/${workbookId}/workbook/tables/${tableId}/columns`,
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
      displayName: 'Value',
      description: 'Rows whose cell equals this are returned.',
      placeholder: 'jane@example.com',
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

    const clearFilterUrl = `${drivePath}/items/${workbookId}/workbook/tables/${tableId}/columns/${columnId}/filter/clear`;

    try {
      await client
        .api(`${drivePath}/items/${workbookId}/workbook/tables/${tableId}/columns/${columnId}/filter/apply`)
        .post({ criteria: { criterion1: `=${sanitizedValue}`, filterOn: 'Custom' } });

      const foundRowsResponse = await client
        .api(`${drivePath}/items/${workbookId}/workbook/tables/${tableId}/range/visibleView/rows`)
        .get();

      return foundRowsResponse.value;
    } finally {
      await client.api(clearFilterUrl).post({});
    }
  }
});
