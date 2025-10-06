// src/lib/common/props.ts

import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { SimplybookMeClient, SimplybookMeClientInfo, SimplybookMeUnit } from './client';
import { SimplybookMeAuthData } from './auth';

export const simplybookMeProps = {
    serviceId: (required = true) =>
        Property.Dropdown({
            displayName: 'Service',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) { return { disabled: true, placeholder: 'Connect your account first', options: [] }; }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                try {
                    const services = await client.getServices();
                    return {
                        disabled: false,
                        options: services.map((service) => ({ label: service.name, value: service.id })),
                    };
                } catch (error) {
                    return { disabled: true, placeholder: 'Could not load services.', options: [] };
                }
            },
        }),

    additionalFields: () =>
        Property.DynamicProperties({
            displayName: 'Additional Fields',
            required: false,
            refreshers: ['serviceId'],
            props: async ({ auth, serviceId }) => {
                if (!auth || !serviceId) { return {}; }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const fields = await client.getAdditionalFields(serviceId as unknown as string);
                const props: DynamicPropsValue = {};
                for (const field of fields) {
                    props[field.name] = Property.ShortText({ displayName: field.title, required: false });
                }
                return props;
            },
        }),

    booking: (required = true) =>
        Property.Dropdown({
            displayName: 'Booking',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) { return { disabled: true, placeholder: 'Connect your account first', options: [] }; }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                try {
                    const bookings = await client.getBookings();
                    return {
                        disabled: false,
                        options: bookings.map((booking) => {
                            const date = new Date(booking.start_datetime).toLocaleString();
                            return { label: `${booking.client.name} - ${date}`, value: JSON.stringify({ id: booking.id, hash: booking.hash }) };
                        }),
                    };
                } catch (error) {
                    return { disabled: true, placeholder: 'Could not load bookings.', options: [] };
                }
            },
        }),

    unitId: (required = true) =>
        Property.Dropdown({
            displayName: 'Provider / Resource',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) { return { disabled: true, placeholder: 'Connect your account first', options: [] }; }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const units = await client.getUnits();
                return {
                    disabled: false,
                    options: units.map((unit: SimplybookMeUnit) => ({ label: unit.name, value: unit.id })),
                };
            },
        }),

    date: (required = true) =>
        Property.DateTime({
            displayName: 'Booking Date',
            required: required,
        }),

    time: (required = true) =>
        Property.Dropdown({
            displayName: 'Time Slot',
            required: required,
            refreshers: ['serviceId', 'unitId', 'date'],
            options: async ({ auth, serviceId, unitId, date }) => {
                if (!auth || !serviceId || !unitId || !date) { return { disabled: true, placeholder: 'Select service, provider, and date', options: [] }; }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const bookingDate = (date as string).split('T')[0];
                const matrix = await client.getStartTimeMatrix(serviceId as string, unitId as string, bookingDate);
                const times = matrix[bookingDate] || [];
                return {
                    disabled: false,
                    options: times.map((time) => ({ label: time, value: time })),
                };
            },
        }),

    clientId: (required = true) =>
        Property.MultiSelectDropdown({
            displayName: 'Client(s)',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) { return { disabled: true, placeholder: 'Connect your account first', options: [] }; }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const clients = await client.getClients();
                return {
                    disabled: false,
                    options: clients.map((client: SimplybookMeClientInfo) => ({ label: `${client.name} (${client.email})`, value: client.id })),
                };
            },
        }),

    singleClientId: (required = false) =>
        Property.Dropdown({
            displayName: 'Client',
            required: required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) { return { disabled: true, placeholder: 'Connect your account first', options: [] }; }
                const client = new SimplybookMeClient(auth as SimplybookMeAuthData);
                const clients = await client.getClients();
                return {
                    disabled: false,
                    options: clients.map((client: SimplybookMeClientInfo) => ({ label: `${client.name} (${client.email})`, value: client.id })),
                };
            },
        }),
};