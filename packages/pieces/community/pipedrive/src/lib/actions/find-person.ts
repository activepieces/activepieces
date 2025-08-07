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

export const findPersonAction = createAction({
    auth: pipedriveAuth,
    name: 'find-person',
    displayName: 'Find Person',
    description: 'Finds a person by any field using Pipedrive API v2.', // ✅ Updated description for v2
    props: {
        searchField: searchFieldProp('person'),
        searchFieldValue: searchFieldValueProp('person'),
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
            resourceUri: '/v2/filters', // ✅ Updated to v2 endpoint
            body: {
                // Added timestamp to the filter name to ensure uniqueness, preventing potential conflicts
                name: `Activepieces Find Person Filter - ${Date.now()}`,
                type: 'people', // Type for persons remains 'people'
                conditions: {
                    glue: 'and',
                    conditions: [
                        {
                            glue: 'and',
                            conditions: [
                                {
                                    object: 'person',
                                    field_id: searchField,
                                    operator: '=',
                                    value: fieldValue,
                                },
                            ],
                        },
                        // The second condition with 'IS NOT NULL' is kept as per original logic,
                        // assuming it serves a specific purpose in the filter's intent.
                        {
                            glue: 'or',
                            conditions: [
                                {
                                    object: 'person',
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

        // Search for persons using the created filter
        // Pipedrive v2 uses 'sort_by' and 'sort_direction' instead of a single 'sort' parameter.
        const persons = await pipedriveApiCall<{ data: { id: number }[] }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/persons', // ✅ Updated to v2 endpoint
            query: {
                filter_id: filter.data.id,
                limit: 1,
                sort_by: 'update_time',     // ✅ Replaced 'sort' with 'sort_by'
                sort_direction: 'desc',     // ✅ Added 'sort_direction'
            },
        });

        // Delete the temporary filter
        await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.DELETE,
            resourceUri: `/v2/filters/${filter.data.id}`, // ✅ Updated to v2 endpoint
        });

        if (isNil(persons.data) || persons.data.length === 0) {
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
            resourceUri: '/v2/personFields', // ✅ Updated to v2 endpoint
        });

        // Transform custom fields in the response data
        const updatedPersonProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            persons.data[0],
        );

        return {
            found: true,
            data: [updatedPersonProperties],
        };
    },
});
