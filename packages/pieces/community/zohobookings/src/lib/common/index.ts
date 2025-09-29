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
    return `https://www.zohoapis.${location}/bookings/v1/json`;
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

  async fetchServices(accessToken: string, location: string, workspaceId?: string) {
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

  async fetchResources(accessToken: string, location: string, serviceId?: string) {
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

  async fetchAppointments(accessToken: string, location: string, options?: {
    serviceId?: string;
    staffId?: string;
    status?: string;
    page?: number;
    perPage?: number;
  }) {
    const formData = new FormData();
    
    if (options?.serviceId) {
      formData.append('service_id', options.serviceId);
    }
    if (options?.staffId) {
      formData.append('staff_id', options.staffId);
    }
    if (options?.status) {
      formData.append('status', options.status);
    }
    if (options?.page) {
      formData.append('page', options.page.toString());
    }
    if (options?.perPage) {
      formData.append('per_page', options.perPage.toString());
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${this.baseUrl(location)}/fetchappointment`,
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
      body: formData,
    });

    return response.body?.response?.returnvalue?.response || [];
  },

  // Schemas
  bookAppointmentSchema: schemas.bookAppointment,
  rescheduleAppointmentSchema: schemas.rescheduleAppointment,
  fetchAvailabilitySchema: schemas.fetchAvailability,
  getAppointmentDetailsSchema: schemas.getAppointmentDetails,
  cancelAppointmentSchema: schemas.cancelAppointment,
};