import { createPiece } from "@activepieces/pieces-framework";
import { discordSendMessageWebhook } from "./lib/actions/send-message-webhook";
import { newMessage } from "./lib/trigger/new-message";

export const discord = createPiece({
    displayName: "Discord",
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    actions: [discordSendMessageWebhook],
    authors: ['creed983', "Abdallah-Alwarawreh"],
    triggers: [newMessage],
});
