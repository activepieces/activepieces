import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';
import * as schemas from './schemas';

export const zohoBookingsAuth = PieceAuth.OAuth2({
  props: {
    location: Property.StaticDropdown({
      displayName: 'Data Center',
      description: 'The data center location of your Zoho Bookings account',
      required: true,
      options: {
        options: [
          {
            label: 'zoho.com (United States)',
            value: 'zoho.com',
          },
          {
            label: 'zoho.eu (Europe)',
            value: 'zoho.eu',
          },
          {
            label: 'zoho.in (India)',
            value: 'zoho.in',
          },
          {
            label: 'zoho.com.au (Australia)',
            value: 'zoho.com.au',
          },
          {
            label: 'zoho.jp (Japan)',
            value: 'zoho.jp',
          },
          {
            label: 'zoho.com.cn (China)',
            value: 'zoho.com.cn',
          },
        ],
      },
    }),
  },
  description: 'Connect your Zoho Bookings account using OAuth2',
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  required: true,
  authUrl: 'https://accounts.{location}/oauth/v2/auth',
  tokenUrl: 'https://accounts.{location}/oauth/v2/token',
  scope: ['zohobookings.data.CREATE', 'zohobookings.data.READ'],
});

export const zohoBookingsCommon = {
  baseUrl: (location = 'zoho.com') => {
    return `https://www.zohoapis.${location
      .substring(5)
      .trim()}/bookings/v1/json`;
  },
  baseHeaders: (accessToken: string) => {
    return {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    };
  },

  // API Methods
  async fetchWorkspaces(accessToken: string, location: string) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseUrl(location)}/workspaces`,
      headers: this.baseHeaders(accessToken),
    });

    return response.body?.response?.returnvalue?.data || [];
  },

  async fetchServices(
    accessToken: string,
    location: string,
    workspaceId?: string
  ) {
    const queryParams: Record<string, string> = {};
    if (workspaceId) {
      queryParams['workspace_id'] = workspaceId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseUrl(location)}/services`,
      headers: this.baseHeaders(accessToken),
      queryParams,
    });

    return response.body?.response?.returnvalue?.data || [];
  },

  async fetchResources(
    accessToken: string,
    location: string,
    serviceId?: string
  ) {
    const queryParams: Record<string, string> = {};
    if (serviceId) {
      queryParams['service_id'] = serviceId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseUrl(location)}/resources`,
      headers: this.baseHeaders(accessToken),
      queryParams,
    });

    return response.body?.response?.returnvalue?.data || [];
  },

  async fetchStaff(accessToken: string, location: string, serviceId?: string) {
    const queryParams: Record<string, string> = {};
    if (serviceId) {
      queryParams['service_id'] = serviceId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseUrl(location)}/staffs`,
      headers: this.baseHeaders(accessToken),
      queryParams,
    });

    return response.body?.response?.returnvalue?.data || [];
  },

  async fetchAppointments(
    accessToken: string,
    location: string,
    options?: {
      serviceId?: string;
      staffId?: string;
      status?: string;
      from_time?: string;
      to_time?: string;
      page?: number;
      perPage?: number;
    }
  ) {
    const payload: Record<string, string | number> = {};

    // if (options?.staffId !== undefined) payload['staff_id'] = Number(options.staffId);
    // if (options?.serviceId) payload['service_id'] = options.serviceId;
    if (options?.from_time) payload['from_time'] = options.from_time;
    // if (options?.to_time) payload['to_time'] = options.to_time;
    // if (options?.status) payload['status'] = options.status;
    // if (options?.page != null) payload['page'] = options.page;
    // if (options?.perPage != null) payload['per_page'] = options.perPage;
    // if (options?.need_customer_more_info != null) {
    //   payload.need_customer_more_info = String(options.need_customer_more_info);
    // }
    // if (options?.customer_name) payload['customer_name'] = options.customer_name;
    // if (options?.customer_email) payload['customer_email'] = options.customer_email;

    // Send as multipart/form-data with a single `data` field
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${this.baseUrl(location)}/fetchappointment`,
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    console.log(JSON.stringify(response.body.response));

    return response.body?.response?.returnvalue?.response || [];
  },

  // Schemas
  bookAppointmentSchema: schemas.bookAppointment,
  rescheduleAppointmentSchema: schemas.rescheduleAppointment,
  fetchAvailabilitySchema: schemas.fetchAvailability,
  getAppointmentDetailsSchema: schemas.getAppointmentDetails,
  cancelAppointmentSchema: schemas.cancelAppointment,
};

export const formatDateTime = (date: string) => {
  const d = new Date(date);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const day = d.getDate().toString().padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

export const bookingIdDropdown = Property.Dropdown({
  displayName: 'Appointment',
  description: 'Select the appointment to get details for',
  required: true,
  refreshers: ['from_time', 'to_time'],
  options: async ({ auth, from_time, to_time }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Authentication required',
        options: [],
      };
    }
    if (!from_time) {
      return {
        disabled: true,
        placeholder: 'Please select From Time first',
        options: [],
      };
    }
    const formattedFromTime = formatDateTime(from_time as string);
    try {
      const location = (auth as any).props?.['location'] || 'zoho.com';
      const appointments = await zohoBookingsCommon.fetchAppointments(
        (auth as any).access_token,
        location,
        {
          perPage: 50,
          from_time: formattedFromTime,
          to_time: to_time ? formatDateTime(to_time as string) : undefined,
        }
      );
      return {
        options: appointments.map((appointment: any) => ({
          label: `${appointment.booking_id} - ${appointment.customer_name} (${appointment.service_name}) - ${appointment.start_time} [${appointment.status}]`,
          value: appointment.booking_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load appointments',
        options: [],
      };
    }
  },
});
