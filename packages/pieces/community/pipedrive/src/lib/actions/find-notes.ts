import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedrivePaginatedApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
// No need for GetField or pipedriveTransformCustomFields if notes don't have custom fields or aren't transformed here.
// If notes can have custom fields and you want them transformed, you'd need GetField and pipedriveTransformCustomFields.

export const findNotesAction = createAction({
    auth: pipedriveAuth,
    name: 'find-notes',
    displayName: 'Find Notes',
    description: 'Finds notes by Deal, Lead, Person, or Organization ID using Pipedrive API v2.', // ✅ Updated description for v2
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
        objectId: Property.ShortText({ // Pipedrive IDs are typically numbers, but ShortText is fine if conversion happens downstream or API handles it.
            displayName: 'ID',
            required: true,
        }),
    },
    async run(context) {
        const { objectType, objectId } = context.propsValue;

        // Pipedrive v2 uses 'sort_by' and 'sort_direction' instead of a single 'sort' parameter.
        const queryParams: Record<string, any> = {
            sort_by: 'update_time', // ✅ Replaced 'sort' with 'sort_by'
            sort_direction: 'desc', // ✅ Added 'sort_direction'
            // Dynamically add the filtering parameter based on objectType
            [objectType]: objectId,
        };

        const response = await pipedrivePaginatedApiCall<Record<string, any>>({ // Assuming a generic record for response data type
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/notes`, // ✅ Updated to v2 endpoint
            query: queryParams,
        });

        if (isNil(response) || response.length === 0) {
            return {
                found: false,
                data: [],
            };
        }

        // Notes in Pipedrive v2 don't typically have custom fields directly in the primary object,
        // so pipedriveTransformCustomFields is not applied here, consistent with the original logic.
        return {
            found: response.length > 0,
            data: response,
        };
    },
});
