import { AuthenticationType, HttpMethod, Property, createAction, httpClient } from "@activepieces/framework";


export const sendMessage = createAction({
    name: "send_message",
    displayName: "Send Message",
    description: "Send a message to a room",
    props: {
        access_token: Property.SecretText({
            displayName: "Access Token",
            description: `
To obtain access token:

1. Log in to the account you want to get the access token for on Element.
2. Click on the name in the top left corner of the screen, then select "Settings" from the dropdown menu.
3. In the Settings dialog, click the "Help & About" tab on the left side of the screen.
4. Scroll to the bottom of the page and click on the "<click to reveal>" part of the "Access Token" section.
5. Copy your access token 
`,
            required: true,
        }),
        room_id: Property.ShortText({
            displayName: "Room ID",
            description: "The ID of the room to send the message to",
            required: true,
        }),
        message: Property.LongText({
            displayName: "Message",
            description: "The message to send",
            required: true,
        }),
    },
    async run({ propsValue }) {
        return await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: "https://matrix.org/_matrix/client/r0/rooms/" + propsValue.room_id + "/send/m.room.message",
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: propsValue.access_token,
            },
            body: {
                msgtype: "m.text",
                body: propsValue.message,
            }
        })
    }
})