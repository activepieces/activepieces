// src/lib/actions/add-comment-to-booking.ts

import { createAction, Property } from "@activepieces/pieces-framework";
// 👇 Import the necessary types
import { simplybookMeAuth, SimplybookMeAuthData } from "../common/auth";
import { SimplybookMeClient } from "../common/client"; 
import { simplybookMeProps } from "../common/props";

export const addCommentToBooking = createAction({
    auth: simplybookMeAuth,
    name: 'add_comment_to_booking',
    displayName: 'Add Comment to Booking',
    description: "Adds a comment or note to an existing booking.",
    props: {
        booking: simplybookMeProps.booking(),
        comment: Property.LongText({
            displayName: 'Comment',
            description: 'The text content of the note or comment to add.',
            required: true,
        }),
    },

    async run(context) {
        const { booking, comment } = context.propsValue;
        
        if (!booking || !comment) {
            throw new Error("Missing required fields: Booking or Comment.");
        }

        const { id } = JSON.parse(booking as string);

        // 👇 FIX: Revert to the simple client constructor
        const client = new SimplybookMeClient(context.auth as SimplybookMeAuthData);

        return await client.makeRpcRequest(
            'setBookingComment',
            [parseInt(id, 10), comment]
        );
    },
});