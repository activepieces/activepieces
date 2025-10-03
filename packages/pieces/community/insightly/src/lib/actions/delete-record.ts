import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpError, HttpMethod } from "@activepieces/pieces-common";
import { insightlyAuth } from "../common/auth";
import { InsightlyClient } from "../common/client";
import { insightlyProps } from "../common/props";

export const deleteRecord = createAction({
    auth: insightlyAuth,
    name: 'delete_record',
    displayName: 'Delete Record',
    description: 'Deletes a record.',
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of record to delete.',
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
            await client.makeRequest(
                HttpMethod.DELETE,
                `/${object_type}/${record_id}`
            );
            return {
                success: true,
            };
        } catch (error) {
            if (error instanceof HttpError && error.response.status === 404) {
                return {
                    success: false,
                    message: "Record not found or already deleted."
                };
            }
            throw error;
        }
    },
});