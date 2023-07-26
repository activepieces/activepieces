import { PieceAuth, Property, createPiece } from "@activepieces/pieces-framework";
import { discordSendMessageWebhook } from "./lib/actions/send-message-webhook";
import { newMessage } from "./lib/trigger/new-message";
import { discordSendApprovalMessage } from "./lib/actions/send-approval-message";

const markdown = `
To obtain a token, follow these steps:
1. Go to https://discord.com/developers/applications
2. Click on Application (or create one if you don't have one)
3. Click on Bot
4. Copy the token
`

export const discordAuth = PieceAuth.SecretText({
    displayName: 'Connection',
    description: markdown,
    required: true,
})

export const discord = createPiece({
    displayName: "Discord",
        minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    auth: discordAuth,
    actions: [discordSendMessageWebhook, discordSendApprovalMessage],
    authors: ['creed983', "Abdallah-Alwarawreh"],
    triggers: [newMessage],
});