import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '../../index';
import { acuityschedulingAuth } from '../../index';

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
  async run(context) {
    const { title, startTime, endTime, description, attendees } = context.propsValue;
    const client = createClient(context.auth);
    
    const response = await client.post('/appointments', {
      title,
      start_time: startTime,
      end_time: endTime,
      description,
      attendees: attendees || []
    });

    return response.data;
  },
});