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
        first_name: Property.ShortText({
            displayName: 'First Name', 
            description: 'First name of the client',
            required: true,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the client',
            required: true,
        }),
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
        description: Property.LongText({
            displayName: 'Description',
            description: 'Description of the appointment',
            required: false,
        }),
        email: Property.Array({
            displayName: 'Attendees',
            description: 'Email addresses of attendees',
            required: false,
        })
    },
    async run({ auth, propsValue }) {
        const { title, startTime, description, email } = propsValue;

        const response = await httpClient.sendRequest<{ status: string; data: Record<string, any> }>({
            method: HttpMethod.POST,
            url: `${BASE_URL}/appointments`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: auth.userId.toString(),
                password: auth.apiKey,
            },
            body: {
                first_name: propsValue.first_name,
                last_name: propsValue.last_name,
                title,
                start_time: startTime,
                description,
                email: email || []
            },
        });

        return response.body.data;
    },
});