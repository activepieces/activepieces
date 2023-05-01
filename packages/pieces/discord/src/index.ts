import packageJson from "../package.json";
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import { discordSendMessageWebhook } from "./lib/actions/send-message-webhook";

export const discord = createPiece({
    name: 'discord',
    displayName: "Discord",
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    version: packageJson.version,
  type: PieceType.PUBLIC,
    actions: [discordSendMessageWebhook],
    authors: ['creed983'],
    triggers: [],
});
