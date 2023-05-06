import { createAction, Property } from "@activepieces/pieces-framework";

import { getRoomId, sendMessage as sendMatrixMessage } from '../common/common';

export const sendMessage = createAction({
    name: "send_message",
    displayName: "Send Message",
    description: "Send a message to a room",
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
            description: `
            To obtain access token & Home server:
            
            1. Log in to the account you want to get the access token for on Element.
            2. Click on the name in the top left corner of the screen, then select "Settings" from the dropdown menu.
            3. In the Settings dialog, click the "Help & About" tab on the left side of the screen.
            4. Scroll to the bottom of the page and click on the "click to reveal" part of the "Access Token" section.
            5. Copy your access token & Home Server URL and paste them into the fields below.
            `,
            props: {
                base_url: Property.ShortText({
                    displayName: "Home Server",
                    required: true,
                }),
                access_token: Property.SecretText({
                    displayName: "Access Token",
                    required: true,
                })
            },
            required: true,
        }),
        room_alias: Property.ShortText({
            displayName: "Room Alias",
            description: "Copy it from room settings -> advanced -> room addresses -> main address",
            required: true,
        }),
        message: Property.LongText({
            displayName: "Message",
            description: "The message to send",
            required: true,
        }),
    },
    async run({ propsValue }) {
        const baseUrl = propsValue.authentication.base_url.replace(/\/$/, "");
        const accessToken = propsValue.authentication.access_token;
        const roomId = (await getRoomId(baseUrl, propsValue.room_alias, accessToken)).body.room_id;

        return await sendMatrixMessage(baseUrl, roomId, accessToken, propsValue.message);
    }
})