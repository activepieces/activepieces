import { createPiece } from "@activepieces/pieces-framework";
import { discordSendMessageWebhook } from "./lib/actions/send-message-webhook";
import { onMesssage } from "./lib/trigger/on-message";

export const discord = createPiece({
    displayName: "Discord",
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    actions: [discordSendMessageWebhook],
    authors: ['creed983'],
    triggers: [onMesssage],
});
