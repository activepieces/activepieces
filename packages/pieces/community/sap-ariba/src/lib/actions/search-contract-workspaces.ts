import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const searchContractWorkspaces = createAction({
    auth: sapAribaAuth,
    name: 'search_contract_workspaces',
    displayName: 'Search Contract Workspaces',
    description: 'Search contract workspaces based on attributes such as title, contract ID, region, etc.',
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Unique identifier of the realm.',
            required: true,
        }),
        user: Property.ShortText({
            displayName: 'User',
            description: 'User ID to perform the action on behalf of.',
            required: true,
        }),
        passwordAdapter: Property.ShortText({
            displayName: 'Password Adapter',
            description: 'Password adapter to authenticate the user.',
            required: true,
        }),
        select: Property.ShortText({
            displayName: 'Select Fields',
            description: 'Comma-separated metadata fields to retrieve (e.g., title,contractid,region).',
            required: false,
        }),
        filter: Property.ShortText({
            displayName: 'Filter',
            description: 'Filter criteria (e.g., LastModified ge \'2023-01-01T00:00:00Z\').',
            required: false,
        }),
        top: Property.Number({
            displayName: 'Page Size',
            description: 'Number of records to return (default 500, max 500).',
            required: false,
            defaultValue: 500,
        }),
        skip: Property.Number({
            displayName: 'Offset',
            description: 'Number of records to skip.',
            required: false,
            defaultValue: 0,
        }),
        count: Property.Checkbox({
            displayName: 'Include Count',
            description: 'Include total number of records in response.',
            required: false,
            defaultValue: false,
        }),
        expand: Property.ShortText({
            displayName: 'Expand',
            description: 'Additional information to fetch (e.g., relatedFactories).',
            required: false,
        }),
    },
    async run(context) {
        const { realm, user, passwordAdapter, select, filter, top, skip, count, expand } = context.propsValue;

        const queryParams: Record<string, string> = {
            realm,
            user,
            passwordAdapter,
        };

        if (select) {
            queryParams['$select'] = select;
        }
        if (filter) {
            queryParams['$filter'] = filter;
        }
        if (top) {
            queryParams['$top'] = top.toString();
        }
        if (skip) {
            queryParams['$skip'] = skip.toString();
        }
        if (count) {
            queryParams['$count'] = 'true';
        }
        if (expand) {
            queryParams['$expand'] = expand;
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            '/contractWorkspaces',
            queryParams
        );

        return response;
    },
});
