import {createPiece} from "../../framework/piece";
import { discordSendMessage } from "./actions/send-message";

export const discord = createPiece({
    name: 'discord',
    displayName: "Discord",
    logoUrl: 'https://cdn.activepieces.com/pieces/discord.png',
    actions: [discordSendMessage],
    triggers: [],
});
