import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { serviceNowAuth } from "../common/auth";
import { ServiceNowClient } from "../common/client";
import { serviceNowProps } from "../common/props";

export const findRecordAction = createAction({
    auth: serviceNowAuth,
    name: 'find_record',
    displayName: 'Find Record(s)',
    description: 'Finds one or more records in a table based on a search query.',
    props: {
        table_name: serviceNowProps.table_name(),
        search_field: serviceNowProps.search_field_dropdown(),
        search_value: Property.ShortText({
            displayName: 'Search Value',
            description: 'The value to search for in the selected field.',
            required: true,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'The maximum number of records to return.',
            required: false,
        }),
        display_value: Property.StaticDropdown({
            displayName: 'Value Type',
            description: 'The type of data to return.',
            required: false,
            options: {
                options: [
                    { label: 'Actual', value: 'false' },
                    { label: 'Display', value: 'true' },
                    { label: 'Both', value: 'all' },
                ]
            }
        }),
        return_fields: serviceNowProps.return_fields_dropdown(),
    },
    async run(context) {
        const { table_name, search_field, search_value, limit, display_value, return_fields } = context.propsValue;
        const client = new ServiceNowClient(context.auth);

        const queryParams: Record<string, string> = {
            sysparm_query: `${search_field}=${search_value}`,
        };

        if (limit) {
            queryParams['sysparm_limit'] = (limit).toString();
        }
        if (display_value) {
            queryParams['sysparm_display_value'] = display_value as string;
        }
        if (return_fields && (return_fields as string[]).length > 0) {
            queryParams['sysparm_fields'] = (return_fields as string[]).join(',');
        }

        const response = await client.makeRequest<{ result: Record<string, unknown>[] }>(
            HttpMethod.GET,
            `/table/${table_name as string}`,
            undefined,
            queryParams
        );
        
      
        return response.result;
    },
});