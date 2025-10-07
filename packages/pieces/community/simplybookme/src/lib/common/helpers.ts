import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { SimplybookAuth, makeJsonRpcCall, getAccessToken } from './auth';

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Service {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
}

interface Booking {
  id: number;
  code?: string;
  start_date?: string;
  start_time?: string;
  client_name?: string;
  event_name?: string;
}

export const clientDropdown = Property.Dropdown({
  displayName: 'Client',
  description: 'Select a client',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first'
      };
    }

    try {
      const clients = await makeJsonRpcCall<Client[]>(
        auth as SimplybookAuth,
        'getClientList',
        ['', null]
      );

      return {
        disabled: false,
        options: clients.map((client) => ({
          label: `${client.name}${client.email ? ` (${client.email})` : ''}${client.phone ? ` - ${client.phone}` : ''}`,
          value: client.id
        }))
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load clients'
      };
    }
  }
});

export const serviceDropdown = Property.Dropdown({
  displayName: 'Service',
  description: 'Select a service',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first'
      };
    }

    try {
      const authData = auth as SimplybookAuth;
      const token = await getAccessToken(authData);

      const response = await httpClient.sendRequest<Service[]>({
        method: HttpMethod.GET,
        url: 'https://user-api-v2.simplybook.me/admin/services',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': authData.companyLogin,
          'X-Token': token
        }
      });

      const services = response.body || [];
      return {
        disabled: false,
        options: services.map((service) => ({
          label: service.name,
          value: service.id
        }))
      };
    } catch (error: any) {
      console.error('Failed to load services:', error.message);
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load services: ${error.message}`
      };
    }
  }
});

export const providerDropdown = Property.Dropdown({
  displayName: 'Provider',
  description: 'Select a service provider',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first'
      };
    }

    try {
      const authData = auth as SimplybookAuth;
      const token = await getAccessToken(authData);

      const response = await httpClient.sendRequest<Provider[]>({
        method: HttpMethod.GET,
        url: 'https://user-api-v2.simplybook.me/admin/providers',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': authData.companyLogin,
          'X-Token': token
        }
      });

      const providers = response.body || [];
      return {
        disabled: false,
        options: providers.map((provider) => ({
          label: provider.name,
          value: provider.id
        }))
      };
    } catch (error: any) {
      console.error('Failed to load providers:', error.message);
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load providers: ${error.message}`
      };
    }
  }
});

export const bookingDropdown = Property.Dropdown({
  displayName: 'Booking',
  description: 'Select a booking',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first'
      };
    }

    try {
      // Get recent bookings (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      const dateTo = today.toISOString().split('T')[0];

      const bookings = await makeJsonRpcCall<Booking[]>(
        auth as SimplybookAuth,
        'getBookings',
        [{ date_from: dateFrom, date_to: dateTo, booking_type: 'non_cancelled' }]
      );

      return {
        disabled: false,
        options: bookings.map((booking) => {
          const label = [
            booking.code ? `#${booking.code}` : `ID: ${booking.id}`,
            booking.start_date,
            booking.start_time,
            booking.client_name,
            booking.event_name
          ]
            .filter(Boolean)
            .join(' - ');

          return {
            label: label || `Booking ${booking.id}`,
            value: booking.id
          };
        })
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load bookings'
      };
    }
  }
});
