// src/lib/actions/find-invoice.ts

import { createAction, Property } from "@activepieces/pieces-framework";
// 👇 Import the necessary types
import { simplybookMeAuth, SimplybookMeAuthData } from "../common/auth";
import { SimplybookMeClient } from "../common/client";
import { simplybookMeProps } from "../common/props";

export const findInvoice = createAction({
    auth: simplybookMeAuth,
    name: 'find_invoice',
    displayName: 'Find Invoice(s)',
    description: 'Finds invoices by searching for bookings with payment information.',
    props: {
        client_id: simplybookMeProps.singleClientId(false),
        date_from: Property.DateTime({
            displayName: 'Start Date',
            description: 'Find invoices for bookings on or after this date.',
            required: false,
        }),
        date_to: Property.DateTime({
            displayName: 'End Date',
            description: 'Find invoices for bookings on or before this date.',
            required: false,
        }),
        code: Property.ShortText({
            displayName: 'Booking Code',
            description: 'The unique code for a specific booking to find its invoice.',
            required: false,
        })
    },

    async run(context) {
        const { client_id, date_from, date_to, code } = context.propsValue;
        
        // 👇 FIX: Revert to the simple client constructor
        const client = new SimplybookMeClient(context.auth as SimplybookMeAuthData);

        const filters: Record<string, unknown> = {};

        if (client_id) filters['client_id'] = parseInt(client_id, 10);
        if (date_from) filters['date_from'] = date_from.split('T')[0];
        if (date_to) filters['date_to'] = date_to.split('T')[0];
        if (code) filters['code'] = code;
        
        const bookings = await client.findBookingsRpc(filters);

        const bookingsWithInvoices = bookings.filter(booking => booking.payment);

        return {
            count: bookingsWithInvoices.length,
            invoices: bookingsWithInvoices,
        };
    },
});