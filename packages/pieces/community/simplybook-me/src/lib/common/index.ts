export * from './types';
export * from './client';

import { Property } from '@activepieces/pieces-framework';
import { SimplyBookClient } from './client';

interface AuthProps {
  companyLogin: string;
  apiKey: string;
  baseUrl: string;
}

export const createDropdownOptions = {
  services: async (auth: unknown) => {
    if (!auth) return { options: [] };
    
    const authProps = auth as AuthProps;
    const client = new SimplyBookClient({
      companyLogin: authProps.companyLogin,
      apiKey: authProps.apiKey,
      baseUrl: authProps.baseUrl,
    });
    
    try {
      const services = await client.getServices();
      return {
        options: services.map(service => ({
          label: `${service.name} (${service.duration}min)`,
          value: service.id,
        })),
      };
    } catch (error) {
      return { options: [] };
    }
  },

  providers: async (auth: unknown) => {
    if (!auth) return { options: [] };
    
    const authProps = auth as AuthProps;
    const client = new SimplyBookClient({
      companyLogin: authProps.companyLogin,
      apiKey: authProps.apiKey,
      baseUrl: authProps.baseUrl,
    });
    
    try {
      const providers = await client.getProviders();
      return {
        options: providers.map(provider => ({
          label: provider.name,
          value: provider.id,
        })),
      };
    } catch (error) {
      return { options: [] };
    }
  },

  clients: async (auth: unknown) => {
    if (!auth) return { options: [] };
    
    const authProps = auth as AuthProps;
    const client = new SimplyBookClient({
      companyLogin: authProps.companyLogin,
      apiKey: authProps.apiKey,
      baseUrl: authProps.baseUrl,
    });
    
    try {
      const clients = await client.getClients();
      return {
        options: clients.map(client => ({
          label: `${client.name} (${client.email})`,
          value: client.id,
        })),
      };
    } catch (error) {
      return { options: [] };
    }
  },

  bookings: async (auth: unknown) => {
    if (!auth) return { options: [] };
    
    const authProps = auth as AuthProps;
    const client = new SimplyBookClient({
      companyLogin: authProps.companyLogin,
      apiKey: authProps.apiKey,
      baseUrl: authProps.baseUrl,
    });
    
    try {
      const bookings = await client.getBookings();
      return {
        options: bookings.map(booking => ({
          label: `${booking.client_name} - ${booking.service_name} (${new Date(booking.start_time).toLocaleDateString()})`,
          value: booking.id,
        })),
      };
    } catch (error) {
      return { options: [] };
    }
  },
};

export const simplybookCommon = {
  companyLogin: Property.ShortText({
    displayName: 'Company Login',
    description: 'Your SimplyBook.me company login',
    required: true,
  }),
  
  apiKey: Property.ShortText({
    displayName: 'API Key',
    description: 'Your SimplyBook.me API key',
    required: true,
  }),

  baseUrl: Property.ShortText({
    displayName: 'Base URL',
    description: 'SimplyBook.me API base URL',
    required: false,
    defaultValue: 'https://user-api.simplybook.me',
  }),

  bookingId: Property.ShortText({
    displayName: 'Booking ID',
    description: 'The ID of the booking',
    required: true,
  }),

  clientId: Property.ShortText({
    displayName: 'Client ID',
    description: 'The ID of the client',
    required: true,
  }),

  serviceId: Property.ShortText({
    displayName: 'Service ID',
    description: 'The ID of the service',
    required: true,
  }),

  providerId: Property.ShortText({
    displayName: 'Provider ID',
    description: 'The ID of the provider',
    required: true,
  }),

  since: Property.DateTime({
    displayName: 'Since',
    description: 'Get events since this date/time',
    required: false,
  }),

  pollInterval: Property.Number({
    displayName: 'Poll Interval (seconds)',
    description: 'How often to check for new events (minimum 60 seconds)',
    required: false,
    defaultValue: 300,
  }),

  eventTypes: Property.StaticMultiSelectDropdown({
    displayName: 'Event Types',
    description: 'Types of events to monitor',
    required: false,
    options: {
      options: [
        { label: 'New Booking', value: 'booking_created' },
        { label: 'Booking Changed', value: 'booking_updated' },
        { label: 'Booking Cancelled', value: 'booking_cancelled' },
        { label: 'New Client', value: 'client_created' },
        { label: 'New Offer', value: 'offer_created' },
        { label: 'New Invoice', value: 'invoice_created' },
      ],
    },
  }),


};