import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL, fetchAppointmentTypes, AcuityAuthProps } from '../common';

interface FindAppointmentsProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  minDate?: string; // ISO DateTime
  maxDate?: string; // ISO DateTime
  calendarID?: number;
  appointmentTypeID?: number;
  status?: 'scheduled' | 'canceled' | 'all'; // mapped to API params
  maxResults?: number;
  direction?: 'ASC' | 'DESC';
  excludeForms?: boolean;
  customFieldID?: number;
  customFieldValue?: string;
}

export const findAppointments = createAction({
  auth: acuitySchedulingAuth,
  name: 'find_appointments',
  displayName: 'Find Appointments',
  description: 'Find appointments based on various criteria, including client information.',
  props: {
    // Client Info Filters
    firstName: Property.ShortText({
      displayName: 'Client First Name',
      description: 'Filter appointments by client first name.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Client Last Name',
      description: 'Filter appointments by client last name.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Client Email',
      description: 'Filter appointments by client e-mail address.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Client Phone',
      description: 'Filter appointments by client phone number. URL encode \'+\' if using country codes (e.g., %2B1234567890).',
      required: false,
    }),
    // Date Filters
    minDate: Property.DateTime({
      displayName: 'Min Date',
      description: 'Only get appointments on or after this date.',
      required: false,
    }),
    maxDate: Property.DateTime({
      displayName: 'Max Date',
      description: 'Only get appointments on or before this date.',
      required: false,
    }),
    // Other Filters
    calendarID: Property.Number({
      displayName: 'Calendar ID',
      description: 'Show only appointments on the calendar with this ID.',
      required: false,
    }),
    appointmentTypeID: Property.Dropdown({
      displayName: 'Appointment Type',
      description: 'Show only appointments of this type.',
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
        return {
          disabled: false,
          options: await fetchAppointmentTypes(auth as AcuityAuthProps, true),
        };
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Appointment Status',
      description: 'Filter by appointment status.',
      required: false,
      defaultValue: 'scheduled',
      options: {
        options: [
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'All (Scheduled & Canceled)', value: 'all' }
        ]
      }
    }),
    // Custom Field Filter
    customFieldID: Property.Number({
        displayName: 'Custom Form Field ID',
        description: 'ID of the custom intake form field to filter by.',
        required: false,
    }),
    customFieldValue: Property.ShortText({
        displayName: 'Custom Form Field Value',
        description: 'Value to match for the specified custom form field ID.',
        required: false,
    }),
    // Result Control
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return (default 100).',
      required: false,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Sort direction for the results.',
      required: false,
      defaultValue: 'DESC',
      options: {
        options: [
          { label: 'Descending (DESC)', value: 'DESC' },
          { label: 'Ascending (ASC)', value: 'ASC' },
        ]
      }
    }),
    excludeForms: Property.Checkbox({
      displayName: 'Exclude Forms',
      description: "Don't include intake forms in the response object (speeds up the response).",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const props = context.propsValue as FindAppointmentsProps;
    const { username, password } = context.auth;

    const queryParams: Record<string, string> = {};

    if (props.firstName) queryParams['firstName'] = props.firstName;
    if (props.lastName) queryParams['lastName'] = props.lastName;
    if (props.email) queryParams['email'] = props.email;
    if (props.phone) queryParams['phone'] = props.phone;

    // Dates are expected in YYYY-MM-DD by Acuity from examples, Property.DateTime returns ISO string
    if (props.minDate) queryParams['minDate'] = props.minDate.split('T')[0];
    if (props.maxDate) queryParams['maxDate'] = props.maxDate.split('T')[0];

    if (props.calendarID) queryParams['calendarID'] = props.calendarID.toString();
    if (props.appointmentTypeID) queryParams['appointmentTypeID'] = props.appointmentTypeID.toString();

    if (props.status === 'canceled') {
      queryParams['canceled'] = 'true';
    } else if (props.status === 'all') {
      queryParams['showall'] = 'true';
    } // 'scheduled' is default, no param needed

    if (props.customFieldID && props.customFieldValue !== undefined) {
        queryParams[`field:${props.customFieldID}`] = props.customFieldValue;
    }

    if (props.maxResults) queryParams['max'] = props.maxResults.toString();
    if (props.direction) queryParams['direction'] = props.direction;
    if (props.excludeForms) queryParams['excludeForms'] = 'true';

    // Ensure at least one client identifier or a broad filter like calendarID/appointmentTypeID is used to avoid fetching all appointments if not intended.
    // This is a soft validation suggestion for the user, not a hard error.
    if (!props.firstName && !props.lastName && !props.email && !props.phone && !props.calendarID && !props.appointmentTypeID && !props.customFieldID) {
        console.warn("Acuity Scheduling 'Find Appointments': No specific client or calendar/type filters provided. This might return a large number of appointments up to the maximum limit.");
    }

    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_URL}/appointments`,
      queryParams,
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      },
    });
  },
});
