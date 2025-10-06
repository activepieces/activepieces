// src/lib/actions/cancel-booking.ts

import { createAction } from "@activepieces/pieces-framework";
// 👇 Import the necessary types
import { simplybookMeAuth, SimplybookMeAuthData } from "../common/auth";
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
        const { secretKey } = context.auth as SimplybookMeAuthData;

        if (!id || !hash || !secretKey) {
            throw new Error("Booking details or API Secret Key are missing from connection.");
        }

        const signatureString = `${id}${hash}${secretKey}`;
        const sign = crypto.createHash('md5').update(signatureString).digest('hex');

        // 👇 FIX: Revert to the simple client constructor
        const client = new SimplybookMeClient(context.auth as SimplybookMeAuthData);

        return await client.makeRpcRequest(
            'cancelBooking',
            [parseInt(id, 10), sign]
        );
    },
});