import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { insightlyAuth } from "../common/auth";
import { InsightlyClient } from "../common/client";
import { insightlyProps } from "../common/props";

export const findRecord = createAction({
    auth: insightlyAuth,
    name: 'find_record',
    displayName: 'Find Record',
    description: 'Look up an existing record by a search field and value.',
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of record to find.',
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
        search_field: insightlyProps.searchField(),
        search_value: Property.ShortText({
            displayName: 'Search Value',
            description: 'The value to search for in the selected field.',
            required: true,
        }),
        fail_if_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: 'If checked, this action will fail if no record is found.',
            required: false,
            defaultValue: false,
        }),
    },

    async run(context) {
        const { apiKey, pod } = context.auth;
        const { object_type, search_field, search_value, fail_if_not_found } = context.propsValue;

        const client = new InsightlyClient(apiKey, pod);
        
        const searchUrl = `/${object_type}/Search?field_name=${encodeURIComponent(search_field)}&field_value=${encodeURIComponent(search_value)}`;
        
        const results = await client.makeRequest<unknown[]>(
            HttpMethod.GET,
            searchUrl
        );

        if (results.length === 0 && fail_if_not_found) {
            throw new Error(`No record found in "${object_type}" where "${search_field}" is "${search_value}".`);
        }

        return results;
    },
});