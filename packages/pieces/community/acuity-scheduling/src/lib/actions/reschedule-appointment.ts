import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL, fetchAvailableDates, fetchAvailableTimes, fetchAppointmentTypes, AcuityAuthProps, fetchCalendars } from '../common';

interface RescheduleAppointmentProps {
  id: number;
  appointmentTypeID: number;
  desiredMonth: string;
  timezone: string;
  availableDateTimeSlot: string;
  calendarID?: number;
  adminReschedule?: boolean;
  noEmail?: boolean;
}

export const rescheduleAppointment = createAction({
  auth: acuitySchedulingAuth,
  name: 'reschedule_appointment',
  displayName: 'Reschedule Appointment',
  description: 'Reschedule an existing appointment to a new date/time.',
  props: {
    id: Property.Number({
      displayName: 'Appointment ID',
      description: 'The ID of the appointment to reschedule.',
      required: true,
    }),
    appointmentTypeID: Property.Dropdown({
      displayName: 'Appointment Type',
      description: 'Select the type of appointment (used for finding new available slots).',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }
        return {
          disabled: false,
          options: await fetchAppointmentTypes(auth as AcuityAuthProps),
        };
      },
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: "Client's timezone (e.g., America/New_York). Required for accurate availability checking.",
      required: true,
      defaultValue: 'UTC',
    }),
    desiredMonth: Property.ShortText({
      displayName: 'Desired New Month (YYYY-MM)',
      description: 'Enter the month for the new desired appointment time (e.g., 2024-01).',
      required: true,
      defaultValue: new Date().toISOString().slice(0, 7),
    }),
    availableDateTimeSlot: Property.Dropdown({
      displayName: 'New Available Date & Time Slot',
      description: 'Select a new available date and time slot for the appointment.',
      required: true,
      refreshers: ['id', 'appointmentTypeID', 'desiredMonth', 'timezone', 'calendarID'],
      options: async ({ auth, propsValue }) => {
        const props = propsValue as Pick<RescheduleAppointmentProps, 'id' | 'appointmentTypeID' | 'desiredMonth' | 'timezone' | 'calendarID'>;

        if (!props.id || !props.appointmentTypeID || !props.desiredMonth || !props.timezone) {
          return {
            disabled: true,
            placeholder: 'Please provide Appt. ID, Type, Timezone, and New Month first',
            options: [],
          };
        }

        try {
          const availableDates = await fetchAvailableDates(
            auth as { username: string; password: string },
            props.appointmentTypeID,
            props.desiredMonth,
            props.timezone,
            props.calendarID
          );

          if (!Array.isArray(availableDates) || availableDates.length === 0) {
            return { disabled: true, placeholder: 'No available dates found', options: [] };
          }

          const allTimeSlots = await Promise.all(
            availableDates.map(async (date: string) => {
              const times = await fetchAvailableTimes(
                auth as { username: string; password: string },
                props.appointmentTypeID,
                date,
                props.timezone,
                props.calendarID,
                [props.id]
              );
              return times.map((time: { time: string; datetime: string }) => ({
                label: `${date} ${time.time}`,
                value: time.datetime,
              }));
            })
          );

          const options = allTimeSlots.flat().filter(Boolean);
          if (options.length === 0) {
            return { disabled: true, placeholder: 'No available time slots found', options: [] };
          }
          return { disabled: false, options };
        } catch (error) {
          console.error('Error fetching availability for reschedule:', error);
          return { disabled: true, placeholder: 'Error fetching slots. Check inputs/console.', options: [] };
        }
      },
    }),
    calendarID: Property.Dropdown({
      displayName: 'New Calendar ID (Optional)',
      description: 'Numeric ID of the new calendar to reschedule to. If blank, stays on current calendar. Submit 0 to auto-assign.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }
        const calendars = await fetchCalendars(auth as AcuityAuthProps);
        // Add an option for auto-assign (value 0)
        const autoAssignOption = { label: "Auto-assign Calendar", value: 0 };
        return {
          disabled: false,
          options: [autoAssignOption, ...calendars],
        };
      },
    }),
    adminReschedule: Property.Checkbox({
      displayName: 'Reschedule as Admin',
      description: 'Set to true to reschedule as an admin. Disables availability validations.',
      required: false,
      defaultValue: false,
    }),
    noEmail: Property.Checkbox({
      displayName: 'Suppress Rescheduling Email/SMS',
      description: 'If true, rescheduling emails or SMS will not be sent.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const props = context.propsValue as RescheduleAppointmentProps;
    const { username, password } = context.auth;

    const queryParams: Record<string, string> = {};
    if (props.adminReschedule) {
      queryParams['admin'] = 'true';
    }
    if (props.noEmail) {
      queryParams['noEmail'] = 'true';
    }

    const body: Record<string, unknown> = {
      datetime: props.availableDateTimeSlot,
    };

    if (props.calendarID !== undefined) { // Allow 0 for auto-assign
        body['calendarID'] = props.calendarID === 0 ? null : props.calendarID;
    }
    if (props.timezone) {
        body['timezone'] = props.timezone;
    }

    return await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${API_URL}/appointments/${props.id}/reschedule`,
      queryParams,
      body,
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      },
    });
  },
});
