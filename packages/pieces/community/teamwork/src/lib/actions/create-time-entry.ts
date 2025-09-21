import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const createTimeEntry = createAction({
    name: 'create_time_entry',
    displayName: 'Create Time Entry',
    description: 'Log time spent on a task in Teamwork',
    auth: teamworkAuth,
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'ID of the task to log time for',
            required: true,
        }),
        description: Property.ShortText({
            displayName: 'Description',
            description: 'Description of the work done',
            required: true,
        }),
        hours: Property.Number({
            displayName: 'Hours',
            description: 'Number of hours worked',
            required: true,
        }),
        minutes: Property.Number({
            displayName: 'Minutes',
            description: 'Number of minutes worked (0-59)',
            required: false,
            defaultValue: 0,
        }),
        date: Property.DateTime({
            displayName: 'Date',
            description: 'Date when the work was done (defaults to today)',
            required: false,
        }),
        personId: Property.ShortText({
            displayName: 'Person ID',
            description: 'ID of the person who did the work (defaults to current user)',
            required: false,
        }),
        isBillable: Property.Checkbox({
            displayName: 'Billable',
            description: 'Mark this time entry as billable',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const { taskId, description, hours, minutes, date, personId, isBillable } = context.propsValue;

        const timeData = {
            'time-entry': {
                description,
                hours: hours.toString(),
                minutes: (minutes || 0).toString(),
                date: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                'person-id': personId || undefined,
                isbillable: isBillable ? '1' : '0',
            }
        };

        // Remove undefined values
        Object.keys(timeData['time-entry']).forEach(key => {
            if (timeData['time-entry'][key] === undefined) {
                delete timeData['time-entry'][key];
            }
        });

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: `/tasks/${taskId}/time_entries.json`,
            body: timeData,
        });

        return response;
    },
});
