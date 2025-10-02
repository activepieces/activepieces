import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { insightlyAuth } from "../common/auth";
import { InsightlyClient } from "../common/client";
import { insightlyProps } from "../common/props";

export const createRecord = createAction({
    auth: insightlyAuth,
    name: 'create_record',
    displayName: 'Create Record',
    description: 'Creates a new record in a specified Insightly object.',
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of record to create.',
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
        fields: insightlyProps.dynamicFields(true), 
    },

    async run(context) {
        const { apiKey, pod } = context.auth;
        const { object_type, fields } = context.propsValue;

        const client = new InsightlyClient(apiKey, pod);
        
        return await client.makeRequest(
            HttpMethod.POST,
            `/${object_type}`,
            fields
        );
    },
});