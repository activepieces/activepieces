// src/lib/actions/find-booking.ts

import { createAction, Property } from "@activepieces/pieces-framework";
// 👇 Import the necessary types
import { simplybookMeAuth, SimplybookMeAuthData } from "../common/auth";
import { SimplybookMeClient } from "../common/client";
import { simplybookMeProps } from "../common/props";

export const findBooking = createAction({
    auth: simplybookMeAuth,
    name: 'find_booking',
    displayName: 'Find Booking(s)',
    description: 'Finds bookings based on various filter criteria.',
    props: {
        date_from: Property.DateTime({
            displayName: 'Start Date',
            description: 'Find bookings on or after this date.',
            required: false,
        }),
        date_to: Property.DateTime({
            displayName: 'End Date',
            description: 'Find bookings on or before this date.',
            required: false,
        }),
        event_id: simplybookMeProps.serviceId(false),
        unit_group_id: simplybookMeProps.unitId(false),
        client_id: simplybookMeProps.singleClientId(false),
        booking_type: Property.StaticDropdown({
            displayName: 'Booking Status',
            required: false,
            options: {
                options: [
                    { label: 'Cancelled', value: 'cancelled' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Pending Approval', value: 'non_approved_yet' },
                ]
            }
        }),
        code: Property.ShortText({
            displayName: 'Booking Code',
            description: 'The unique code for a specific booking.',
            required: false,
        })
    },

    async run(context) {
        const { date_from, date_to, event_id, unit_group_id, client_id, booking_type, code } = context.propsValue;
        
        // 👇 FIX: Revert to the simple client constructor
        const client = new SimplybookMeClient(context.auth as SimplybookMeAuthData);

        const filters: Record<string, unknown> = {};

        if (date_from) filters['date_from'] = date_from.split('T')[0];
        if (date_to) filters['date_to'] = date_to.split('T')[0];
        if (event_id) filters['event_id'] = parseInt(event_id as string, 10);
        if (unit_group_id) filters['unit_group_id'] = parseInt(unit_group_id as string, 10);
        if (client_id) filters['client_id'] = parseInt(client_id as string, 10);
        if (booking_type) filters['booking_type'] = booking_type;
        if (code) filters['code'] = code;
        
        return await client.findBookingsRpc(filters);
    },
});