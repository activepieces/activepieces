import { Property, createAction } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../../index';

export const createAppointment = createAction({
    auth: acuityschedulingAuth,
    name: 'create_appointment',
    displayName: 'Create Appointment',
    description: 'Create a new appointment in ActivityScheduling',
    props: {
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the appointment',
            required: true,
        }),
        startTime: Property.DateTime({
            displayName: 'Start Time',
            description: 'The start time of the appointment',
            required: true,
        }),
        endTime: Property.DateTime({
            displayName: 'End Time',
            description: 'The end time of the appointment',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Description of the appointment',
            required: false,
        }),
        attendees: Property.Array({
            displayName: 'Attendees',
            description: 'Email addresses of attendees',
            required: false,
        })
    },
    async run({ auth, propsValue}) {
        const { title, startTime, endTime, description, attendees } = propsValue;

        const response = await httpClient.sendRequest<{ status: string; data: Record<string, any> }>({
            method: HttpMethod.POST,
            url: `${BASE_URL}/Client/createCleint`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth,
            },
            body: {
                title,
                start_time: startTime,
                end_time: endTime,
                description,
                attendees: attendees || []
            },
        });

        return response.body.data;
    },
});