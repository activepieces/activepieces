import { createAction, Property } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../../index';

export const addBlockedTimeAction = createAction({
    auth: acuityschedulingAuth,
    name: 'add_blocked_time',
    displayName: 'Add Blocked Time',
    description: 'Block off time slots to prevent appointments',
    props: {
        start_time: Property.DateTime({
            displayName: 'Start Time',
            description: 'When the blocked time begins',
            required: true,
        }),
        end_time: Property.DateTime({
            displayName: 'End Time',
            description: 'When the blocked time ends',
            required: true,
        }),
        calender_id: Property.ShortText({
            displayName: 'Calendar ID',
            description: 'The ID of the calendar to block time on',
            required: true,
        }),
        notes: Property.LongText({
            displayName: 'Notes',
            description: 'Optional notes for the blocked time',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const {
            start_time,
            end_time,
            calender_id,
            notes,
        } = propsValue;

        const blockData: Record<string, any> = {
            calendar_id: calender_id,
            start_time,
            end_time,
            is_blocked: true
        };

        const response = await httpClient.sendRequest<{ status: string; data: Record<string, any> }>({
            method: HttpMethod.POST,
            url: `${BASE_URL}/blocks`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: auth.userId.toString(),
                password: auth.apiKey,
            },
            body: {
                calender_id,
                start_time,
                end_time,
                notes: notes || '',

            },
        });

        return response.body.data;
    },
}); 