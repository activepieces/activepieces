import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { insightlyAuth } from "../common/auth";
import { InsightlyClient } from "../common/client";
import { insightlyProps } from "../common/props";

export const updateRecord = createAction({
    auth: insightlyAuth,
    name: 'update_record',
    displayName: 'Update Record',
    description: 'Update an existing record’s fields.',
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of record to update.',
            required: true,
            options: {
                options: [
                    { label: 'Contact', value: 'Contacts' },
                    { label: 'Lead', value: 'Leads' },
                    { label: 'Opportunity', value: 'Opportunities' },
                    { label: 'Organisation', value: 'Organisations' },
                    { label: 'Project', value: 'Projects' },
                    { label: 'Task', value: 'Tasks' },
                ],
            },
        }),
        record_id: insightlyProps.recordId(), 
        fields: insightlyProps.dynamicFields(false), 
    },

    async run(context) {
        const { apiKey, pod } = context.auth;
        const { object_type, record_id, fields } = context.propsValue;

        const client = new InsightlyClient(apiKey, pod);
        
        const payload: { [key: string]: unknown } = {};
        for (const key in fields) {
            if (fields[key] !== null && fields[key] !== undefined && fields[key] !== '') {
                payload[key] = fields[key];
            }
        }
        
        return await client.makeRequest(
            HttpMethod.PUT,
            `/${object_type}/${record_id}`,
            undefined, 
            payload   
        );
    },
});