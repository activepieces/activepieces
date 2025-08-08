import { createAction } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../../index';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { searchFieldProp, searchFieldValueProp } from '../common/props';

export const findOrganizationAction = createAction({
    auth: pipedriveAuth,
    name: 'find-organization',
    displayName: 'Find Organization',
    description: 'Finds an organization by any field using Pipedrive API v2.', 
    props: {
        searchField: searchFieldProp('organization'),
        searchFieldValue: searchFieldValueProp('organization'),
    },
    async run(context) {
        const { searchField } = context.propsValue;
        const fieldValue = context.propsValue.searchFieldValue['field_value'];

        if (isNil(fieldValue)) {
            throw new Error('Please enter a value for the field');
        }

        // Create Filter using Pipedrive API v2 endpoint
        // The structure of the filter conditions remains largely compatible in v2.
        const filter = await pipedriveApiCall<{ data: { id: number } }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/filters', 
            body: {
                // Added timestamp to the filter name to ensure uniqueness, preventing potential conflicts
                name: `Activepieces Find Organization Filter - ${Date.now()}`,
                type: 'org', // Type for organizations remains 'org'
                conditions: {
                    glue: 'and',
                    conditions: [
                        {
                            glue: 'and',
                            conditions: [
                                {
                                    object: 'organization',
                                    field_id: searchField,
                                    operator: '=',
                                    value: fieldValue,
                                },
                            ],
                        },
                        
                        {
                            glue: 'or',
                            conditions: [
                                {
                                    object: 'organization',
                                    field_id: searchField,
                                    operator: 'IS NOT NULL',
                                    value: null,
                                },
                            ],
                        },
                    ],
                },
            },
        });

        // Search for organizations using the created filter
        // Pipedrive v2 uses 'sort_by' and 'sort_direction' instead of a single 'sort' parameter.
        const organizations = await pipedriveApiCall<{ data: { id: number }[] }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizations', 
            query: {
                filter_id: filter.data.id,
                limit: 1,
                sort_by: 'update_time',     
                sort_direction: 'desc',    
            },
        });

        // Delete the temporary filter
        await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.DELETE,
            resourceUri: `/v2/filters/${filter.data.id}`, 
        });

        if (isNil(organizations.data) || organizations.data.length === 0) {
            return {
                found: false,
                data: [],
            };
        }

        // Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizationFields', 
        });

        // Transform custom fields in the response data
        const updatedOrganizationProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            organizations.data[0],
        );

        return {
            found: true,
            data: [updatedOrganizationProperties],
        };
    },
});
