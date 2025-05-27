import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest } from '../common';
import { acuityAuth } from '../../index';
import { fetchCalendars, fetchAppointmentTypes } from '../common';

export const createAppointment = createAction({
  name: 'create_appointment',
  displayName: 'Create Appointment',
  description: 'Create a new appointment with full options.',
  auth: acuityAuth,
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
      description: "Client's first name.",
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
      description: "Client's last name.",
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: "Client's email address (e.g., example@email.com).",
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      description: "Client's phone number. May be required in account settings.",
    }),
    datetime: Property.ShortText({
      displayName: 'Datetime',
      required: true,
      description: 'Date and time of the appointment.',
    }),
    appointmentTypeID: Property.Dropdown({
      displayName: 'Appointment Type',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const types = await fetchAppointmentTypes(auth as { userId: string; apiKey: string });
        return types.map((type: any) => ({
          label: type.name,
          value: type.id,
        }));
      },
      description: 'Select the appointment type to schedule.',
    }),
    calendarID: Property.Dropdown({
      displayName: 'Calendar',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const calendars = await fetchCalendars(auth as { userId: string; apiKey: string });
        return calendars.map((calendar: any) => ({
          label: calendar.name,
          value: calendar.id,
        }));
      },
      description: 'Select the calendar to book on. If not provided, an available calendar will be selected automatically.',
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      required: false,
      description: "Client's timezone.",
    }),
    certificate: Property.ShortText({
      displayName: 'Certificate',
      required: false,
      description: 'Package or coupon certificate code to apply to the appointment.',
    }),
    fields: Property.Json({
      displayName: 'Fields',
      required: false,
      description: 'Custom form field values (as an array of objects).',
    }),
    addonIDs: Property.Array({
      displayName: 'Addon IDs',
      required: false,
      description: 'List of addon IDs to include in the appointment (e.g., [12345, 67890]).',
    }),
    labels: Property.Json({
      displayName: 'Labels',
      required: false,
      description: 'Array of label objects to attach to the appointment. Only one label is currently supported.',
    }),
    smsOptIn: Property.Checkbox({
      displayName: 'SMS Opt-In',
      required: false,
      defaultValue: false,
      description: 'Enable if the client has given consent to receive SMS notifications. Required for some appointment types.',
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
      description: 'Internal notes visible to admins. Can only be set when booking as an admin.',
    }),
  },
  async run(context) {
    const {
      firstName,
      lastName,
      email,
      phone,
      datetime,
      appointmentTypeID,
      calendarID,
      timezone,
      certificate,
      fields,
      addonIDs,
      labels,
      smsOptIn,
      notes,
    } = context.propsValue;

    const body = {
      firstName,
      lastName,
      email,
      phone,
      datetime,
      appointmentTypeID,
      calendarID,
      timezone,
      certificate,
      fields,
      addonIDs,
      labels,
      smsOptIn,
      notes,
    };

    return await makeAcuityRequest(
      context.auth,
      HttpMethod.POST,
      '/appointments',
      body
    );
  },
});
