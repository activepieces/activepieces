import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedrivePaginatedApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const findNotesAction = createAction({
    auth: pipedriveAuth,
    name: 'find-notes',
    displayName: 'Find Notes',
    description: 'Finds notes by Deal, Lead, Person, or Organization ID using Pipedrive API v2.', 
    props: {
        objectType: Property.StaticDropdown({
            displayName: 'Search By',
            required: true,
            options: {
                disabled: false,
                options: [
                    {
                        label: 'Deal',
                        value: 'deal_id',
                    },
                    {
                        label: 'Lead',
                        value: 'lead_id',
                    },
                    {
                        label: 'Person',
                        value: 'person_id',
                    },
                    {
                        label: 'Organization',
                        value: 'org_id',
                    },
                ],
            },
        }),
        objectId: Property.ShortText({ 
            displayName: 'ID',
            required: true,
        }),
    },
    async run(context) {
        const { objectType, objectId } = context.propsValue;

        // Pipedrive v2 uses 'sort_by' and 'sort_direction' instead of a single 'sort' parameter.
        const queryParams: Record<string, any> = {
            sort_by: 'update_time', 
            sort_direction: 'desc',
            [objectType]: objectId,
        };

        const response = await pipedrivePaginatedApiCall<Record<string, any>>({ 
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/notes`, 
            query: queryParams,
        });

        if (isNil(response) || response.length === 0) {
            return {
                found: false,
                data: [],
            };
        }

        return {
            found: response.length > 0,
            data: response,
        };
    },
});
