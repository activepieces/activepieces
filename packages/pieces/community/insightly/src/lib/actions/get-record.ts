import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpError, HttpMethod } from "@activepieces/pieces-common";
import { insightlyAuth } from "../common/auth";
import { InsightlyClient } from "../common/client";
import { insightlyProps } from "../common/props";

export const getRecord = createAction({
    auth: insightlyAuth,
    name: 'get_record',
    displayName: 'Get Record',
    description: 'Gets a record by its ID.',
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of record to retrieve.',
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
    },

    async run(context) {
        const { apiKey, pod } = context.auth;
        const { object_type, record_id } = context.propsValue;

        const client = new InsightlyClient(apiKey, pod);
        
        try {
            const record = await client.makeRequest(
                HttpMethod.GET,
                `/${object_type}/${record_id}`
            );
            return {
                found: true,
                record: record,
            };
        } catch (error) {
            if (error instanceof HttpError && error.response.status === 404) {
                return {
                    found: false,
                    record: null,
                };
            }
            throw error;
        }
    },
});