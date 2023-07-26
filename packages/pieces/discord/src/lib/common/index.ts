import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { Channel, Guild } from "../trigger/new-message";
import { Property } from "@activepieces/pieces-framework";

export const discordCommon = {
    channel: Property.Dropdown<string>({
        displayName: 'Channel',
        description: 'List of channels',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
        if(!auth) {
            return {
             disabled: true,
             options: [],
             placeholder: "Please connect your bot first"
           };
        }
        
        const request = {
            method: HttpMethod.GET,
            url: "https://discord.com/api/v9/users/@me/guilds",
            headers: {
                "Authorization": "Bot " + auth,
            }
        };

        const res = await httpClient.sendRequest<Guild[]>(request);
        const options: { options: { value: string, label: string }[] } = { options: [] };

        if (res.body.length === 0) return {
            disabled: true,
            options: [],
            placeholder: "No guilds found, please add the bot to a guild first"
        };
        
        await Promise.all(res.body.map(async (guild) => {
            const requestChannels = {
            method: HttpMethod.GET,
            url: "https://discord.com/api/v9/guilds/" + guild.id + "/channels",
            headers: {
                "Authorization": "Bot " + auth,
            }
            };

            const resChannels = await httpClient.sendRequest<Channel[]>(requestChannels);
            resChannels.body.forEach((channel) => {
            options.options.push({
                value: channel.id,
                label: channel.name
            });
            });
        }));

        return options;
        },
    }),
}