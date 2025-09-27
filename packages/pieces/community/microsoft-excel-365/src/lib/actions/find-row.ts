import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const findRow = createAction({
    auth: excelAuth,
    name: 'findRow',
    displayName: 'Find Row',
    description: 'Locate a row by specifying a lookup column and value (e.g. find a row where “ID” = 123).',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        table_id: excelCommon.table_id,
        lookup_column: Property.Dropdown({
            displayName: 'Lookup Column',
            description: 'The column to search in.',
            required: true,
            refreshers: ['workbook_id', 'table_id'],
            options: async ({ auth, workbook_id, table_id }) => {
                if (!auth || !workbook_id || !table_id) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a workbook and table first.',
                    };
                }
                const authProp = auth as OAuth2PropertyValue;
                const response = await httpClient.sendRequest<{ value: { id: string; name: string }[] }>({
                    method: HttpMethod.GET,
                    url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/tables/${table_id}/columns`,
                    authentication: {
                        type: AuthenticationType.BEARER_TOKEN,
                        token: authProp.access_token,
                    },
                });
                
                return {
                    disabled: false,
                    options: response.body.value.map((column) => ({
                        label: column.name,
                        value: column.id,
                    })),
                };
            }
        }),
        lookup_value: Property.ShortText({
            displayName: 'Lookup Value',
            description: 'The value to find in the lookup column.',
            required: true,
        }),
    },
    async run(context) {
        const { workbook_id, table_id, lookup_column, lookup_value } = context.propsValue;
        const { access_token } = context.auth;
        const columnId = lookup_column; 


        const clearFilterUrl = `${excelCommon.baseUrl}/items/${workbook_id}/workbook/tables/${table_id}/columns/${columnId}/filter/clear`;

        try {
            
            await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/tables/${table_id}/columns/${columnId}/filter/apply`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: access_token,
                },
                body: {
                    criteria: {
                        criterion1: `=${lookup_value}`, // Prefix with '=' for exact match
                        filterOn: "Custom",
                    },
                },
            });

            
            const foundRowsResponse = await httpClient.sendRequest<{ value: unknown[] }>({
                method: HttpMethod.GET,
                url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/tables/${table_id}/range/visibleView/rows`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: access_token,
                },
            });
            
            
            return foundRowsResponse.body.value;

        } finally {
            
            await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: clearFilterUrl,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: access_token,
                },
                body: {} 
            });
        }
    },
});