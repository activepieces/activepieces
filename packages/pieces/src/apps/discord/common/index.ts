import {AuthPropertyValue, Property} from "../../../framework/property/prop.model";
import {HttpRequest} from "../../../common/http/core/http-request";
import {HttpMethod} from "../../../common/http/core/http-method";
import {AuthenticationType} from "../../../common/authentication/core/authentication-type";
import {httpClient} from "../../../common/http/core/http-client";

export const discordCommon = {
    baseUrl: "https://discord.com/api",
    authentication: Property.OAuth2({
        displayName: "Authentication",
        required: true,
        authUrl: 'https://discord.com/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        scope: ['bot'],
        extra: {
            // [Send Message, Send Message in Thread, Read message history, Mention everyone,
            // Use external Emojis, Use External Stickers, Add reactions, Use slash comments]
            permissions: 534723914816
        }
    }),
    channel: Property.Dropdown({
        displayName: "Channel",
        required: true,
        refreshers: ['authentication'],
        options: async (value) => {
            if (value['authentication'] === undefined) {
                return {
                    disabled: true,
                    placeholder: "connect discord account",
                    options: []
                }
            }
            const authentication: AuthPropertyValue = value['authentication'] as AuthPropertyValue;
            const guildId = authentication['data']['guild']['id'];
            const accessToken = authentication['access_token'];
            const request: HttpRequest<never> = {
                method: HttpMethod.GET,
                url: `${discordCommon.baseUrl}/guilds/${guildId}/channels`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: accessToken,
                },
            };
            const channels = await httpClient.sendRequest<{id: string, name: string}[]>(request);
            return {
                disabled: false,
                placeholder: "Select channel",
                options: channels.map(ch => {
                    return {
                        label: ch.name,
                        value: ch.id
                    }
                })
            }
        }
    })
}
