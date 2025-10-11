import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { serviceNowAuth } from "../common/auth";
import { ServiceNowClient } from "../common/client";
import { serviceNowProps } from "../common/props";

export const findFileAction = createAction({
    auth: serviceNowAuth,
    name: 'find_file',
    displayName: 'Find File(s)',
    description: 'Finds one or more file attachments on a specific record.',
    props: {
        table_name: serviceNowProps.table_name(),
        record_id: serviceNowProps.record_id(),
        file_name: Property.ShortText({
            displayName: 'File Name (Optional)',
            description: 'The name of the file to find. If left blank, all files for the record will be returned. This search is case-insensitive and contains the text.',
            required: false,
        }),
    },
    async run(context) {
        const { table_name, record_id, file_name } = context.propsValue;
        const client = new ServiceNowClient(context.auth);

        let query = `table_name=${table_name}^table_sys_id=${record_id}`;
        if (file_name) {
            query += `^file_nameLIKE${file_name}`;
        }

        const queryParams: Record<string, string> = {
            sysparm_query: query
        };

        const response = await client.makeRequest<{ result: Record<string, unknown>[] }>(
            HttpMethod.GET,
            `/attachment`, 
            undefined,
            queryParams
        );

        return response.result;
    },
});