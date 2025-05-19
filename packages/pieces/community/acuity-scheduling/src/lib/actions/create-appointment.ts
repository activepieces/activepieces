import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL, fetchAvailableDates, fetchAvailableTimes } from '../common';

// Define the type for the props for THIS action
interface CreateAppointmentProps {
  appointmentTypeID: number;
  desiredMonth: string;
  timezone: string;
  calendarID?: number;
  availableDateTimeSlot: string;
  firstName: string;
  lastName: string;
  email: string;
  adminBooking?: boolean;
  noEmail?: boolean;
  phone?: string;
  certificate?: string;
  notes?: string;
  smsOptIn?: boolean;
  fields?: Array<{ id: number; value: string }>;
  addonIDs?: Array<{ id: number }>;
  labels?: Array<{ id: number }>;
}

export const createAppointment = createAction({
  auth: acuitySchedulingAuth,
  name: 'create_appointment',
  displayName: 'Create Appointment',
  description: 'Create a new appointment.',
  props: {
    // Required fields for availability checking
    appointmentTypeID: Property.Number({
      displayName: 'Appointment Type ID',
      description: 'Numeric ID of the appointment type.',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: "Client's timezone (e.g., America/New_York). Required for accurate availability checking.",
      required: true,
      defaultValue: 'UTC',
    }),
    desiredMonth: Property.ShortText({
      displayName: 'Desired Month (YYYY-MM)',
      description: 'Enter the month you want to check for availability (e.g., 2024-01).',
      required: true,
      defaultValue: new Date().toISOString().slice(0, 7), // Current month as default
    }),
    availableDateTimeSlot: Property.Dropdown({
      displayName: 'Available Date & Time Slot',
      description: 'Select an available date and time slot for the appointment.',
      required: true,
      refreshers: ['appointmentTypeID', 'desiredMonth', 'timezone', 'calendarID'],
      options: async ({ auth, propsValue }) => {
        const props = propsValue as Pick<CreateAppointmentProps, 'appointmentTypeID' | 'desiredMonth' | 'timezone' | 'calendarID'>;

        if (!props.appointmentTypeID || !props.desiredMonth) {
          return {
            disabled: true,
            placeholder: 'Please fill in the appointment type and desired month first',
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
            return {
              disabled: true,
              placeholder: 'No available dates found for the selected month',
              options: [],
            };
          }

          const allTimeSlots = await Promise.all(
            availableDates.map(async (date: string) => {
              const times = await fetchAvailableTimes(
                auth as { username: string; password: string },
                props.appointmentTypeID,
                date,
                props.timezone,
                props.calendarID
                // No ignoreAppointmentIDs for create new appointment
              );
              return times.map((time: { time: string; datetime: string }) => ({
                label: `${date} ${time.time}`,
                value: time.datetime,
              }));
            })
          );

          const options = allTimeSlots.flat().filter(Boolean);

          if (options.length === 0) {
            return {
              disabled: true,
              placeholder: 'No available time slots found',
              options: [],
            };
          }

          return {
            disabled: false,
            options,
          };
        } catch (error) {
          console.error('Error fetching availability:', error);
          return {
            disabled: true,
            placeholder: 'Error fetching available slots. Please check your inputs.',
            options: [],
          };
        }
      },
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "Client's first name.",
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: "Client's last name.",
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "Client's email address. (Optional if booking as admin)",
      required: true,
    }),
    adminBooking: Property.Checkbox({
      displayName: 'Book as Admin',
      description: 'Set to true to book as an admin. Disables availability/attribute validations, allows setting notes, and makes Calendar ID required.',
      required: false,
      defaultValue: false,
    }),
    calendarID: Property.Number({
      displayName: 'Calendar ID',
      description: 'Numeric ID of the calendar. Required if booking as admin. If not provided, Acuity tries to find an available calendar automatically for non-admin bookings.',
      required: false,
    }),
    noEmail: Property.Checkbox({
      displayName: 'Suppress Confirmation Email/SMS',
      description: 'If true, confirmation emails or SMS will not be sent.',
      required: false,
      defaultValue: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: "Client's phone number. May be required based on your Acuity account settings. Optional for admins.",
      required: false,
    }),
    certificate: Property.ShortText({
      displayName: 'Certificate Code',
      description: 'Package or coupon certificate code.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Appointment notes. Only settable if booking as admin.',
      required: false,
    }),
    smsOptIn: Property.Checkbox({
      displayName: 'SMS Opt-In',
      description: 'Indicates whether the client has explicitly given permission to receive SMS messages.',
      required: false,
      defaultValue: false,
    }),
    fields: Property.Array({
      displayName: 'Form Fields',
      description: 'Custom form field values for the appointment.',
      required: false,
      properties: {
        id: Property.Number({
          displayName: 'Field ID',
          description: 'Numeric ID of the form field.',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Field Value',
          description: 'Value for the form field. For checkbox lists, use a comma-delimited string with spaces (e.g., "Option 1, Option 2").',
          required: true,
        }),
      },
    }),
    addonIDs: Property.Array({
      displayName: 'Addon IDs',
      description: 'List of numeric IDs for addons to be included.',
      required: false,
      properties: {
        id: Property.Number({
          displayName: 'Addon ID',
          description: 'Numeric ID of the addon.',
          required: true,
        }),
      },
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'List of labels to apply to the appointment. Currently, only one label is accepted by the API.',
      required: false,
      properties: {
        id: Property.Number({
          displayName: 'Label ID',
          description: 'Numeric ID of the label.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const props = context.propsValue as CreateAppointmentProps;
    const { username, password } = context.auth;

    const queryParams: Record<string, string> = {};
    if (props.adminBooking) {
      queryParams['admin'] = 'true';
    }
    if (props.noEmail) {
      queryParams['noEmail'] = 'true';
    }

    const body: Record<string, unknown> = {
      datetime: props.availableDateTimeSlot,
      appointmentTypeID: props.appointmentTypeID,
      firstName: props.firstName,
      lastName: props.lastName,
      email: props.email,
    };

    if (props.calendarID) body['calendarID'] = props.calendarID;
    if (props.phone) body['phone'] = props.phone;
    if (props.timezone) body['timezone'] = props.timezone;
    if (props.certificate) body['certificate'] = props.certificate;
    if (props.adminBooking && props.notes) body['notes'] = props.notes;
    if (props.smsOptIn) body['smsOptIn'] = props.smsOptIn;

    if (props.fields && props.fields.length > 0) {
      body['fields'] = props.fields;
    }
    if (props.addonIDs && props.addonIDs.length > 0) {
      body['addonIDs'] = props.addonIDs.map((item: any) => item.id);
    }
    if (props.labels && props.labels.length > 0) {
      body['labels'] = props.labels;
    }

    if (props.adminBooking && !props.calendarID) {
      throw new Error("Calendar ID is required when booking as admin.");
    }
    if (props.adminBooking && props.email === '') {
      delete body['email'];
    }

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${API_URL}/appointments`,
      queryParams: queryParams,
      body: body,
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      },
    });
  },
});
