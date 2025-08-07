import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { activityTypeIdProp, filterIdProp, ownerIdProp } from '../common/props';
import { pipedrivePaginatedApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const findActivityAction = createAction({
    auth: pipedriveAuth,
    name: 'find-activity',
    displayName: 'Find Activity',
    description: 'Finds an activity by subject using Pipedrive API v2. Note: Subject filtering is performed client-side after fetching activities.', // ✅ Updated description for v2 and clarified client-side filtering
    props: {
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        exactMatch: Property.Checkbox({
            displayName: 'Exact Match',
            required: false,
            defaultValue: true,
        }),
        assignTo: ownerIdProp('Assign To', false), // This prop returns the numeric owner ID
        type: activityTypeIdProp(false),
        filterId: filterIdProp('activity', false),
        status: Property.StaticDropdown({
            displayName: 'Status',
            required: false,
            options: {
                disabled: false,
                options: [
                    {
                        label: 'Done',
                        value: true, // ✅ In v2, 'done' is a boolean
                    },
                    {
                        label: 'Not Done',
                        value: false, // ✅ In v2, 'done' is a boolean
                    },
                ],
            },
        }),
    },
    async run(context) {
        const { subject, assignTo, type, filterId, status, exactMatch } = context.propsValue;

        // Pipedrive v2 API for listing activities expects 'owner_id' and boolean 'done' status.
        // It also uses 'sort_by' and 'sort_direction' instead of a single 'sort' parameter.
        const queryParams: Record<string, any> = {
            // ✅ 'user_id' is renamed to 'owner_id' in v2
            owner_id: assignTo,
            type: type,
            // ✅ 'done' expects a boolean (true/false) in v2
            done: status,
            // ✅ 'sort' parameter is replaced by 'sort_by' and 'sort_direction' in v2
            sort_by: 'update_time',
            sort_direction: 'desc',
        };

        // filter_id is still supported in v2 for listing activities
        if (!isNil(filterId)) {
            queryParams.filter_id = filterId;
        }

        // The pipedrivePaginatedApiCall utility should handle the cursor-based pagination
        // internally when interacting with the /v2/activities endpoint.
        const response = await pipedrivePaginatedApiCall<{ id: number; subject: string }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/activities', // ✅ Updated to v2 endpoint
            query: queryParams,
        });

        if (isNil(response) || response.length === 0) {
            return {
                found: false,
                data: [],
            };
        }

        const result = [];

        // Client-side filtering for 'subject' as the /v2/activities list endpoint
        // does not directly support 'subject' as a query parameter.
        for (const activity of response) {
            if (activity.subject) { // Ensure subject exists before attempting comparison
                if (exactMatch && activity.subject === subject) {
                    result.push(activity);
                } else if (!exactMatch && activity.subject.toLowerCase().includes(subject.toLowerCase())) {
                    result.push(activity);
                }
            }
        }

        return {
            found: result.length > 0,
            data: result,
        };
    },
});
