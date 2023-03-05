import packageJson from "../package.json";
import { createPiece } from "@activepieces/framework";
import { discordSendMessageWebhook } from "./lib/actions/send-message-webhook";

export const discord = createPiece({
    name: 'discord',
    displayName: "Discord",
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    version: packageJson.version,
    actions: [discordSendMessageWebhook],
    authors: ['creed983'],
    triggers: [],
});
