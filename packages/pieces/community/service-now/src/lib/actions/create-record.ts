import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { serviceNowAuth } from "../common/auth";
import { ServiceNowClient } from "../common/client";
import { serviceNowProps } from "../common/props"; // Import the new props file

export const createRecordAction = createAction({
    auth: serviceNowAuth,
    name: 'create_record',
    displayName: 'Create Record',
    description: 'Create a record in a specified table with provided fields.',
    props: {
        table_name: serviceNowProps.table_name(),
        fields: serviceNowProps.fields()
    },
    async run(context) {
        const { table_name, fields } = context.propsValue;

        const client = new ServiceNowClient(context.auth);

        return await client.makeRequest(
            HttpMethod.POST,
            `/table/${table_name}`,
            fields
        );
    },
});