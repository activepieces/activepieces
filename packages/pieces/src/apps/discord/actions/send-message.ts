import { createAction } from "../../../framework/action/action";
import { discordCommon } from "../common";


export const discordSendMessage = createAction({
    name: "send_message",
    description: 'Send a discord message',
    displayName: "Send Message",
    props: {
        authentication: discordCommon.authentication,
        channel: discordCommon.channel
    },
    async run(configValue) {
        return configValue;
    }
});