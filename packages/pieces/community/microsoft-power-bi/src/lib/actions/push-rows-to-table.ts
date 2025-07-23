import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { microsoftPowerBiAuth } from '../../index';

type PowerBIRow = {
    [key: string]: string | number | boolean | null | undefined;
};

export const pushRowsToDatasetTableAction = createAction({
    auth:microsoftPowerBiAuth,
    name: 'push_rows_to_dataset_table',
    displayName: 'Push Rows to Dataset Table',
    description: 'Add rows to a table in a Power BI dataset (supports Push, Streaming, and PushStreaming modes)',
    props: {
        dataset_id: Property.Dropdown({
            displayName: 'Dataset',
            description: 'Select a dataset.',
            required: true,
            refreshers: ['auth'],
            options: async (propsValue) => {
                const auth = propsValue['auth'] as OAuth2PropertyValue;
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first.'
                    };
                }

                try {
                    const response = await httpClient.sendRequest<{value:{name:string,id:string}[]}>({
                        method: HttpMethod.GET,
                        url: 'https://api.powerbi.com/v1.0/myorg/datasets',
                        headers: {
                            'Authorization': `Bearer ${auth.access_token}`
                        }
                    });

                    return {
                        options: response.body.value.map((dataset) => ({
                            label: dataset.name,
                            value: dataset.id
                        }))
                    };
                } catch (error) {
                    console.error('Error fetching datasets:', error);
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading datasets'
                    };
                }
            }
        }),
        table_name: Property.Dropdown({
            displayName: 'Table',
            description: 'Select a table',
            required: true,
            refreshers: ['auth', 'dataset_id'],
            options: async (propsValue) => {
                const auth = propsValue['auth'] as OAuth2PropertyValue;
                const datasetId = propsValue['dataset_id'] as string;
                if (!auth || !datasetId) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a dataset first'
                    };
                }

                try {
                    const response = await httpClient.sendRequest<{value:{name:string}[]}>({
                        method: HttpMethod.GET,
                        url: `https://api.powerbi.com/v1.0/myorg/datasets/${datasetId}/tables`,
                        headers: {
                            'Authorization': `Bearer ${auth.access_token}`
                        }
                    });

                    return {
                        options: response.body.value.map((table) => ({
                            label: table.name,
                            value: table.name
                        }))
                    };
                } catch (error) {
                    console.error('Error fetching tables:', error);
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading tables'
                    };
                }
            }
        }),
        rows: Property.Json({
            displayName: 'Rows',
            description: 'JSON object containing the rows to add to the table. Each row must match your table schema.',
            required: true,
            defaultValue: {
                rows: [
                {
                    Id: 1,
                    Name: "Example",
                    Value: 42.5,
                    Timestamp: new Date().toISOString()
                }
            ]
            }
        }),
        skip_refresh: Property.Checkbox({
            displayName: 'Skip Dataset Refresh',
            description: 'Skip refreshing the dataset after pushing data (only applies to Push and PushStreaming modes)',
            required: false,
            defaultValue: false
        })
    },
    async run(context) {
        const auth = context.auth;
        const datasetId = context.propsValue.dataset_id;
        const tableName = context.propsValue.table_name;
        let rows: PowerBIRow[];
        
        try {
            // Parse rows if it's a string
            const rowsInput = context.propsValue.rows;
            const parsedInput = typeof rowsInput === 'string' ? JSON.parse(rowsInput) : rowsInput;
            
            // Handle both direct array and object with rows property
            if (Array.isArray(parsedInput)) {
                rows = parsedInput;
            } else if (parsedInput && parsedInput.rows && Array.isArray(parsedInput.rows)) {
                rows = parsedInput.rows;
            } else {
                throw new Error('Rows must be either an array or an object with a rows array property');
            }
        } catch (e) {
            console.error('Error parsing rows:', e);
            throw new Error('Invalid rows format');
        }
        
        const skipRefresh = context.propsValue.skip_refresh;
        const baseUrl = 'https://api.powerbi.com/v1.0/myorg';

        try {
            // 1. Get dataset info
            const datasetResponse = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${baseUrl}/datasets/${datasetId}`,
                headers: {
                    'Authorization': `Bearer ${auth.access_token}`
                }
            });

            // 2. Get table info
            const tableResponse = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${baseUrl}/datasets/${datasetId}/tables`,
                headers: {
                    'Authorization': `Bearer ${auth.access_token}`
                }
            });

            // 3. Validate table exists and is in the dataset
            const tables = tableResponse.body.value;
            const targetTable = tables.find((t: any) => t.name === tableName);
            if (!targetTable) {
                throw new Error(`Table '${tableName}' not found in dataset. Available tables: ${tables.map((t: any) => t.name).join(', ')}`);
            }

            // 4. Prepare and send data
            const url = `${baseUrl}/datasets/${datasetId}/tables/${tableName}/rows`;

            const response = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: url,
                headers: {
                    'Authorization': `Bearer ${auth.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    rows
                }
            });

            if (response.status >= 400) {
                const errorMessage = response.body?.error?.message || JSON.stringify(response.body);
                throw new Error(`Power BI API Error: ${response.status} - ${errorMessage}`);
            }

            // 5. Refresh dataset if not skipped
            let refreshResponse = null;
            if (!skipRefresh) {
                refreshResponse = await httpClient.sendRequest({
                    method: HttpMethod.POST,
                    url: `${baseUrl}/datasets/${datasetId}/refreshes`,
                    headers: {
                        'Authorization': `Bearer ${auth.access_token}`
                    }
                }).catch(e => ({ status: e.response?.status, body: e.response?.body }));
            }

            return {
                success: true,
                statusCode: response.status,
                body: response.body,
                url: url,
                sentData: rows,
                datasetInfo: datasetResponse.body,
                tables: tableResponse.body,
                refreshAttempt: refreshResponse?.body
            };
        } catch (error) {
            console.error('Error pushing data to Power BI:', error);
            throw error;
        }
    }
}); 