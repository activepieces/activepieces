import { createPiece } from "@activepieces/framework";
import { discordSendMessageWebhook } from "./lib/actions/send-message-webhook";

export const discord = createPiece({
    name: 'discord',
    displayName: "Discord",
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    version: '0.0.0',
    actions: [discordSendMessageWebhook],
    authors: ['creed983'],
    triggers: [],
});
