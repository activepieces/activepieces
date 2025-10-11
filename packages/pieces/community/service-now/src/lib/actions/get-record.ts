import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { serviceNowAuth } from "../common/auth";
import { ServiceNowClient } from "../common/client";
import { serviceNowProps } from "../common/props";

export const getRecordAction = createAction({
    auth: serviceNowAuth,
    name: 'get_record',
    displayName: 'Get Record',
    description: 'Retrieves a specific record from a table by its ID.',
    props: {
        table_name: serviceNowProps.table_name(),
        record_id: serviceNowProps.record_id(),
        display_value: Property.StaticDropdown({
            displayName: 'Value Type',
            description: 'The type of data to return, either actual database values or user-friendly display values.',
            required: false,
            options: {
                options: [
                    { label: 'Actual', value: 'false' },
                    { label: 'Display', value: 'true' },
                    { label: 'Both', value: 'all' },
                ]
            }
        }),
        fields: serviceNowProps.return_fields_dropdown(),
    },
    async run(context) {
        const { table_name, record_id, display_value, fields } = context.propsValue;
        const client = new ServiceNowClient(context.auth);

        const queryParams: Record<string, string> = {};
        if (display_value) {
            queryParams['sysparm_display_value'] = display_value as string;
        }
        if (fields && (fields as string[]).length > 0) {
            queryParams['sysparm_fields'] = (fields as string[]).join(',');
        }

        const response = await client.makeRequest<{ result: Record<string, unknown> }>(
            HttpMethod.GET,
            `/table/${table_name as string}/${record_id as string}`,
            undefined,
            queryParams
        );
        
        return response.result;
    },
});