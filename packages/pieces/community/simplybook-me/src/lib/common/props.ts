

import { Property, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { SimplybookMeClient } from './client';
import { SimplybookMeAuthData } from './auth';

export const simplybookMeProps = {
    serviceId: (required = true) =>
        Property.Dropdown({
            displayName: 'Service',
            description: 'The service to associate with.',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Connect your account first',
                        options: [],
                    };
                }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                try {
                    const services = await client.getServices();
                    return {
                        disabled: false,
                        options: services.map((service) => ({
                            label: service.name,
                            value: service.id,
                        })),
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        placeholder: 'Could not load services. Please check documentation for the correct endpoint.',
                        options: [],
                    };
                }
            },
        }),

    additionalFields: () =>
        Property.DynamicProperties({
            displayName: 'Additional Fields',
            description: "The custom intake form fields for the selected service.",
            required: true,
            refreshers: ['serviceId'],
            props: async ({ auth, serviceId }) => {
                if (!auth || !serviceId) {
                    return {};
                }

                const client = new SimplybookMeClient(auth as unknown as SimplybookMeAuthData);
                const fields = await client.getAdditionalFields(serviceId as unknown as string);

                const props: DynamicPropsValue = {};
                for (const field of fields) {
                    switch (field.type) {
                        case 'digits':
                        case 'text':
                            props[field.id] = Property.ShortText({
                                displayName: field.name,
                                required: false,
                            });
                            break;
                        case 'textarea':
                            props[field.id] = Property.LongText({
                                displayName: field.name,
                                required: false,
                            });
                            break;
                        default:
                            props[field.id] = Property.ShortText({
                                displayName: field.name,
                                required: false,
                            });
                            break;
                    }
                }
                return props;
            },
        }),

    booking: (required = true) =>
        Property.Dropdown({
            displayName: 'Booking',
            description: 'The booking to select.',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Connect your account first',
                        options: [],
                    };
                }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                try {
                    const bookings = await client.getBookings();
                    return {
                        disabled: false,
                        options: bookings.map((booking) => {
                            const bookingDate = new Date(booking.start_datetime).toLocaleString();
                            return {
                                label: `${booking.client.name} - ${bookingDate}`,
                                value: JSON.stringify({
                                    id: booking.id,
                                    hash: booking.hash
                                })
                            };
                        }),
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        placeholder: 'Could not load bookings.',
                        options: [],
                    };
                }
            },
        }),

    
    unitId: (required = true) =>
        Property.Dropdown({
            displayName: 'Provider / Resource',
            description: 'The provider or resource for the service.',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) { return { disabled: true, placeholder: 'Connect your account first', options: [] }; }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const units = await client.getUnits();
                return {
                    disabled: false,
                    options: units.map((unit) => ({
                        label: unit.name,
                        value: unit.id,
                    })),
                };
            },
        }),

    date: (required = true) =>
        Property.DateTime({
            displayName: 'Booking Date',
            description: 'The date of the booking.',
            required: required,
        }),



    time: (required = true) =>
        Property.Dropdown({
            displayName: 'Time Slot',
            description: 'The available time for the selected date, service, and provider.',
            required: required,
            refreshers: ['serviceId', 'unitId', 'date'], // This is key!
            options: async ({ auth, serviceId, unitId, date }) => {
                if (!auth || !serviceId || !unitId || !date) {
                    return {
                        disabled: true,
                        placeholder: 'Select a service, provider, and date first',
                        options: [],
                    };
                }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const bookingDate = (date as string).split('T')[0];

                const matrix = await client.getStartTimeMatrix(
                    serviceId as string,
                    unitId as string,
                    bookingDate
                );

                const times = matrix[bookingDate] || [];
                return {
                    disabled: false,
                    options: times.map((time) => ({
                        label: time,
                        value: time,
                    })),
                };
            },
        }),

    clientId: (required = true) =>
        Property.MultiSelectDropdown({
            displayName: 'Client(s)',
            description: 'The client(s) to select.',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Connect your account first',
                        options: [],
                    };
                }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const clients = await client.getClients();
                return {
                    disabled: false,
                    options: clients.map((client) => {
                        return {
                            label: `${client.name} (${client.email})`,
                            value: client.id,
                        };
                    }),
                };
            },
        }),

    singleClientId: (required = false) =>
        Property.Dropdown({
            displayName: 'Client',
            description: 'The client to filter bookings for.',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Connect your account first',
                        options: [],
                    };
                }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const clients = await client.getClients();
                return {
                    disabled: false,
                    options: clients.map((client) => {
                        return {
                            label: `${client.name} (${client.email})`,
                            value: client.id,
                        };
                    }),
                };
            },
        }),
};