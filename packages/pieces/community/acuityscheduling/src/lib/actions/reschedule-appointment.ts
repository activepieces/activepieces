import { createAction, Property } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { createClient } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../../index';

export const rescheduleAppointmentAction = createAction({
  auth: acuityschedulingAuth,
  name: 'reschedule_appointment',
  displayName: 'Reschedule Appointment',
  description: 'Reschedule an existing appointment',
  props: {
    appointment_id: Property.ShortText({
      displayName: 'Appointment ID',
      description: 'The ID of the appointment to reschedule',
      required: true,
    }),
    new_start_time: Property.DateTime({
      displayName: 'New Start Time',
      description: 'The new start time for the appointment',
      required: true,
    }),
    new_end_time: Property.DateTime({
      displayName: 'New End Time',
      description: 'The new end time for the appointment',
      required: true,
    }),
    send_notifications: Property.Checkbox({
      displayName: 'Send Notifications',
      description: 'Whether to send rescheduling notifications to participants',
      required: false,
      defaultValue: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional reason for rescheduling',
      required: false,
    }),
  },
  async run({auth , propsValue}) {
    const { 
      appointment_id, 
      new_start_time, 
      new_end_time,
      send_notifications,
      reason
    } = propsValue;


    
      const response = await httpClient.sendRequest<{
                status: string;
                data: Array<Record<string, any>>;
            }>({
                method: HttpMethod.PATCH,
                url: `${BASE_URL}/appointments/${appointment_id}/reschedule`,
                queryParams: {
                    new_start_time: new_start_time,
                    new_end_time: new_end_time,  
                },
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth,
                },
            });
      return {
			found: response.body.status === 'success' && response.body.data.length > 0,
			result: response.body.data,
		};
  },
});