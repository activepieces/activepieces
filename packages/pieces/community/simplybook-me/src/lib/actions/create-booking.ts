import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient, CreateBookingDto, CreateBookingDtoSchema, createDropdownOptions } from '../common';

export const createBooking = createAction({
  auth: simplybookAuth,
  name: 'create_booking',
  displayName: 'Create Booking',
  description: 'Create a new booking in SimplyBook.me',
  props: {
    clientId: Property.Dropdown({
      displayName: 'Client',
      description: 'Select the client making the booking',
      required: true,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.clients(auth),
    }),
    serviceId: Property.Dropdown({
      displayName: 'Service',
      description: 'Select the service to book',
      required: true,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.services(auth),
    }),
    providerId: Property.Dropdown({
      displayName: 'Provider',
      description: 'Select the service provider',
      required: true,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.providers(auth),
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'When the booking should start',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes for the booking',
      required: false,
    }),
  },
  async run(context) {
    const { clientId, serviceId, providerId, startDateTime, notes } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    // Validate input
    const payload: CreateBookingDto = {
      client_id: clientId,
      service_id: serviceId,
      provider_id: providerId,
      start_date_time: startDateTime,
      notes,
    };

    const validatedPayload = CreateBookingDtoSchema.parse(payload);

    // Create client and make booking
    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const booking = await client.createBooking(validatedPayload);
      return {
        success: true,
        booking,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});