

import { createAction, Property } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
import { SimplybookMeClient } from "../common/client";
import { simplybookMeProps } from "../common/props";

export const createBooking = createAction({
    auth: simplybookMeAuth,
    name: 'create_booking',
    displayName: 'Create a Booking',
    description: 'Creates a new booking with required booking parameters.',
    props: {
        serviceId: simplybookMeProps.serviceId(),
        unitId: simplybookMeProps.unitId(),
        date: simplybookMeProps.date(),
        time: simplybookMeProps.time(),
        
        client_name: Property.ShortText({
            displayName: 'Client Full Name',
            required: true,
        }),
        client_email: Property.ShortText({
            displayName: 'Client Email Address',
            required: true,
        }),
        client_phone: Property.ShortText({
            displayName: 'Client Phone Number',
            required: true,
        }),

        additionalFields: simplybookMeProps.additionalFields(),
    },
    async run(context) {
        const { serviceId, unitId, date, time, client_name, client_email, client_phone, additionalFields } = context.propsValue;
        
        const client = new SimplybookMeClient(context.auth);

        if (!serviceId || !unitId || !date || !time) {
            throw new Error("Missing required fields: Service, Provider, Date, or Time.");
        }

        const clientData = {
            name: client_name,
            email: client_email,
            phone: client_phone,
        };

        const bookingDate = date.split('T')[0];
        
        const params = [
            parseInt(serviceId, 10),
            parseInt(unitId, 10),
            bookingDate,
            time,
            clientData,
            additionalFields || null
        ];

        return await client.makeRpcRequest('book', params);
    },
});