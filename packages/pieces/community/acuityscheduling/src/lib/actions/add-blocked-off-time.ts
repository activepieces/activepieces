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
        title: Property.ShortText({
            displayName: 'Title',
            description: 'Description for the blocked time',
            required: true,
        }),
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
        staff_id: Property.ShortText({
            displayName: 'Staff ID',
            description: 'ID of staff member this applies to (leave blank for all)',
            required: false,
        }),
        recurring: Property.Checkbox({
            displayName: 'Recurring Block',
            description: 'Whether this is a recurring time block',
            required: false,
            defaultValue: false,
        }),
        recurrence_pattern: Property.StaticDropdown({
            displayName: 'Recurrence Pattern',
            description: 'How often the block repeats',
            required: false,
            options: {
                options: [
                    { label: 'Daily', value: 'daily' },
                    { label: 'Weekly', value: 'weekly' },
                    { label: 'Monthly', value: 'monthly' }
                ]
            },
            defaultValue: 'weekly'
        }),
        recurrence_end_date: Property.DateTime({
            displayName: 'Recurrence End Date',
            description: 'When the recurring block should stop',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const {
            title,
            start_time,
            end_time,
            staff_id,
            recurring,
            recurrence_pattern,
            recurrence_end_date
        } = propsValue;

        const blockData: Record<string, any> = {
            title,
            start_time,
            end_time,
            is_blocked: true
        };

        if (staff_id) blockData['staff_id'] = staff_id;
        if (recurring) {
            blockData['recurring'] = true;
            blockData['recurrence_pattern'] = recurrence_pattern;
            if (recurrence_end_date) blockData['recurrence_end_date'] = recurrence_end_date;
        }

        const response = await httpClient.sendRequest<{ status: string; data: Record<string, any> }>({
            method: HttpMethod.POST,
            url: `${BASE_URL}/appointments/createBlockedTime`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.apiKey && auth.userId,
            },
            body: {
                title,
                start_time,
                end_time,
                staff_id,
                recurring,
                recurrence_pattern,
                recurrence_end_date
            },
        });

        return response.body.data;
    },
}); 