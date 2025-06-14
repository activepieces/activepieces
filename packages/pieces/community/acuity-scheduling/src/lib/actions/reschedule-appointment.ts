import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest } from '../common';
import { acuityAuth } from '../../index';
import { calendarIdDropdown } from '../common/props';

export const rescheduleAppointment = createAction({
  name: 'reschedule_appointment',
  displayName: 'Reschedule Appointment',
  description: 'Reschedule an existing appointment.',
  auth: acuityAuth,
  props: {
    appointmentID: Property.Number({
      displayName: 'Appointment ID',
      required: true,
      description: 'ID of the appointment to be rescheduled.',
    }),
    datetime: Property.ShortText({
      displayName: 'New Datetime',
      required: true,
      description: 'Required date and time for the appointment.',
    }),
    calendarID: calendarIdDropdown,
    timezone: Property.ShortText({
      displayName: 'Timezone',
      required: false,
      description: 'Client timezone.',
    }),
    admin: Property.Checkbox({
      displayName: 'Admin',
      required: false,
      defaultValue: false,
      description: 'Perform the action as an admin.',
    }),
    noEmail: Property.Checkbox({
      displayName: 'No Email',
      required: false,
      defaultValue: false,
      description: 'Suppress email notifications for this reschedule.',
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    
    if (context.propsValue.admin) {
      queryParams['admin'] = 'true';
    }
    
    if (context.propsValue.noEmail) {
      queryParams['noEmail'] = 'true';
    }

    const body: any = {
      datetime: context.propsValue.datetime,
    };

    if (context.propsValue.calendarID !== undefined) {
      body.calendarID = context.propsValue.calendarID;
    }

    if (context.propsValue.timezone) {
      body.timezone = context.propsValue.timezone;
    }

    return await makeAcuityRequest(
      context.auth,
      HttpMethod.PUT,
      `/appointments/${context.propsValue.appointmentID}/reschedule`,
      body,
      queryParams
    );
  },
});
