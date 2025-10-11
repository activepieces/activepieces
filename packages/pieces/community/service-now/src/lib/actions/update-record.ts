import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { serviceNowAuth } from "../common/auth";
import { ServiceNowClient } from "../common/client";
import { serviceNowProps } from "../common/props";

export const updateRecordAction = createAction({
    auth: serviceNowAuth,
    name: 'update_record',
    displayName: 'Update Record',
    description: 'Update an existing record in a specified table.',
    props: {
        table_name: serviceNowProps.table_name(),
        record_id: serviceNowProps.record_id(),
        fields: serviceNowProps.fields()
    },
    async run(context) {
        const { table_name, record_id, fields } = context.propsValue;

        const client = new ServiceNowClient(context.auth);


        return await client.makeRequest(
            HttpMethod.PATCH,
            `/table/${table_name}/${record_id}`,
            fields
        );
    },
});