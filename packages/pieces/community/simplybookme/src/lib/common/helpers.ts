import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { SimplybookAuth, makeJsonRpcCall, getAccessToken, simplybookAuth } from './auth';

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

interface NoteType {
  id: number;
  name: string;
  color?: string;
}

export const clientDropdown = Property.Dropdown({
  auth: simplybookAuth,
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
        auth.props,

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
  auth: simplybookAuth,
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
      const response = await Promise.race([
        makeJsonRpcCall<any>( auth.props
, 'getEventList', []),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 20s')), 20000)
        )
      ]);

      // Handle different response formats
      let services: Service[] = [];
      if (Array.isArray(response)) {
        services = response;
      } else if (response && typeof response === 'object') {
        // Check if it's an object with numeric keys (object-formatted array)
        const keys = Object.keys(response);
        if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
          services = Object.values(response);
        } else {
          services = response.data || response.result || response.items || [];
        }
      }

      if (!Array.isArray(services) || services.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: services.length === 0 ? 'No services found' : 'Invalid response format'
        };
      }

      return {
        disabled: false,
        options: services.map((service) => ({
          label: service.name || `Service ${service.id}`,
          value: service.id
        }))
      };
    } catch (error: any) {
      console.error('Failed to load services:', error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error: ${error.message?.substring(0, 50) || 'Failed to load'}`
      };
    }
  }
});

export const providerDropdown = Property.Dropdown({
  auth: simplybookAuth,
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
      const response = await Promise.race([
        makeJsonRpcCall<any>( auth.props
, 'getUnitList', []),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 20s')), 20000)
        )
      ]);

      // Handle different response formats
      let providers: Provider[] = [];
      if (Array.isArray(response)) {
        providers = response;
      } else if (response && typeof response === 'object') {
        // Check if it's an object with numeric keys (object-formatted array)
        const keys = Object.keys(response);
        if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
          providers = Object.values(response);
        } else {
          providers = response.data || response.result || response.items || [];
        }
      }

      if (!Array.isArray(providers) || providers.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: providers.length === 0 ? 'No providers found' : 'Invalid response format'
        };
      }

      return {
        disabled: false,
        options: providers.map((provider) => ({
          label: provider.name || `Provider ${provider.id}`,
          value: provider.id
        }))
      };
    } catch (error: any) {
      console.error('Failed to load providers:', error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error: ${error.message?.substring(0, 50) || 'Failed to load'}`
      };
    }
  }
});

export const noteTypeDropdown = Property.Dropdown({
  auth: simplybookAuth,
  displayName: 'Note Type',
  description: 'Select a note type',
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
      const authData =  auth.props
;
      const token = await getAccessToken(authData);

      const response = await Promise.race([
        httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://user-api-v2.simplybook.me/admin/calendar-notes/types',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Login': authData.companyLogin,
            'X-Token': token
          },
          timeout: 20000
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 20s')), 20000)
        )
      ]);

      // Handle different response formats
      const responseData = (response as any).body;
      let noteTypes: NoteType[] = [];
      
      if (Array.isArray(responseData)) {
        noteTypes = responseData;
      } else if (responseData && typeof responseData === 'object') {
        const keys = Object.keys(responseData);
        if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
          noteTypes = Object.values(responseData);
        } else {
          noteTypes = responseData.data || responseData.result || responseData.items || [];
        }
      }

      if (!Array.isArray(noteTypes) || noteTypes.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: noteTypes.length === 0 ? 'No note types found' : 'Invalid response format'
        };
      }

      return {
        disabled: false,
        options: noteTypes.map((noteType) => ({
          label: noteType.name || `Note Type ${noteType.id}`,
          value: noteType.id
        }))
      };
    } catch (error: any) {
      console.error('Failed to load note types:', error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error: ${error.message?.substring(0, 50) || 'Failed to load'}`
      };
    }
  }
});

export const bookingDropdown = Property.Dropdown({
  auth: simplybookAuth,
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
        auth.props,

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
