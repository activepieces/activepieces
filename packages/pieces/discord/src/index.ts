import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { discordSendMessageWebhook } from "./lib/actions/send-message-webhook";
import { newMessage } from "./lib/trigger/new-message";
import { discordSendApprovalMessageWebhook } from "./lib/actions/send-approval-message-webhook";

const markdown = `
To obtain a token, follow these steps:
1. Go to https://discord.com/developers/applications
2. Click on Application (or create one if you don't have one)
3. Click on Bot
4. Copy the token
`

export const discordAuth = PieceAuth.SecretText({
    displayName: 'Token',
    description: markdown,
    required: true,
})

export const discord = createPiece({
    displayName: "Discord",
        minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    auth: discordAuth,
    actions: [discordSendMessageWebhook, discordSendApprovalMessageWebhook],
    authors: ['creed983', "Abdallah-Alwarawreh"],
    triggers: [newMessage],
});
