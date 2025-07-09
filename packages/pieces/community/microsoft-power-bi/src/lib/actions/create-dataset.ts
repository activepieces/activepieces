import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { microsoftPowerBiAuth } from '../../index';

type ColumnDefinition = {
    name: string;
    dataType: 'String' | 'Int64' | 'Double' | 'DateTime' | 'Boolean';
};

type TableDefinition = {
    name: string;
    columns: ColumnDefinition[];
};

type DatasetMode = 'Push' | 'Streaming' | 'PushStreaming';

export const createDatasetAction = createAction({
    auth:microsoftPowerBiAuth,
    name: 'create_dataset',
    displayName: 'Create Dataset',
    description: 'Create a new dataset in Power BI with custom schema (Push, Streaming, or PushStreaming mode).',
    props: {
        dataset_name: Property.ShortText({
            displayName: 'Dataset Name',
            description: 'Name of the dataset to create',
            required: true,
            defaultValue: 'ActivepiecesDataset'
        }),
        mode: Property.StaticDropdown({
            displayName: 'Dataset Mode',
            description: 'The mode of the dataset',
            required: true,
            defaultValue: 'Push',
            options: {
                options: [
                    { label: 'Push', value: 'Push' },
                    { label: 'Streaming', value: 'Streaming' },
                    { label: 'PushStreaming', value: 'PushStreaming' }
                ]
            }
        }),
        tables: Property.Json({
            displayName: 'Tables',
            description: 'Define the tables and their columns for the dataset (JSON format)',
            required: true,
            defaultValue: [
                {
                    name: 'Data',
                    columns: [
                        { name: 'Id', dataType: 'Int64' },
                        { name: 'Name', dataType: 'String' },
                        { name: 'Value', dataType: 'Double' },
                        { name: 'Timestamp', dataType: 'DateTime' }
                    ]
                }
            ]
        })
    },
    async run(context) {
        const auth = context.auth;
        const datasetName = context.propsValue.dataset_name;
        const mode = context.propsValue.mode as DatasetMode;
                
        let tables: TableDefinition[];
        try {
            // Parse the tables JSON
            const parsedTables = typeof context.propsValue.tables === 'string' 
                ? JSON.parse(context.propsValue.tables)
                : context.propsValue.tables;
            
            // Expect tables to be an array directly
            if (Array.isArray(parsedTables)) {
                tables = parsedTables;
            } else {
                throw new Error('Tables must be an array of table definitions');
            }
            
        } catch (e) {
            console.error('Error parsing tables:', e);
            throw new Error(`Invalid tables JSON format. Received value: ${JSON.stringify(context.propsValue.tables)}`);
        }

        // Always use My Workspace URL
        const baseUrl = 'https://api.powerbi.com/v1.0/myorg';

        // Define the dataset schema
        const datasetDefinition = {
            name: datasetName,
            defaultMode: mode,
            tables: tables.map(table => ({
                name: table.name,
                columns: table.columns.map(column => ({
                    name: column.name,
                    dataType: column.dataType.toLowerCase()
                }))
            }))
        };

        try {
            // Create the dataset
            const requestBody = {
                name: datasetName,
                defaultMode: mode,
                tables: datasetDefinition.tables
            };
            
            const response = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${baseUrl}/datasets`,
                headers: {
                    'Authorization': `Bearer ${auth.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: requestBody
            });

            if (response.status >= 400) {
                throw new Error(`Failed to create dataset: ${response.status} - ${JSON.stringify(response.body)}`);
            }

            return {
                success: true,
                statusCode: response.status,
                datasetInfo: response.body,
                schema: datasetDefinition
            };
        } catch (error) {
            console.error('Error creating dataset:', error);
            throw error;
        }
    }
}); 