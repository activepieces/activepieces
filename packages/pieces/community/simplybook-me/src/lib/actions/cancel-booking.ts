
import { createAction, Property } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
import { SimplybookMeClient } from "../common/client";
import { simplybookMeProps } from "../common/props"; 
import * as crypto from "crypto";

export const cancelBooking = createAction({
    auth: simplybookMeAuth,
    name: 'cancel_booking',
    displayName: 'Cancel a Booking',
    description: 'Cancels an existing booking.',
    props: {
        booking: simplybookMeProps.booking(),
    },

    async run(context) {
        const { id, hash } = JSON.parse(context.propsValue.booking as string);
        const { secretKey } = context.auth;

        const bookingId = id;
        const bookingHash = hash;

        const signatureString = `${bookingId}${bookingHash}${secretKey}`;


        const sign = crypto.createHash('md5').update(signatureString).digest('hex');

        const client = new SimplybookMeClient(context.auth);

        return await client.makeRpcRequest(
            'cancelBooking',
            [parseInt(bookingId, 10), sign]
        );
    },
});