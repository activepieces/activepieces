import {AuthenticationType} from '../../../common/authentication/core/authentication-type';
import {HttpMethod} from '../../../common/http/core/http-method';
import type {HttpRequest} from '../../../common/http/core/http-request';
import {createAction} from '../../../framework/action/action';
import {httpClient} from "../../../common/http/core/http-client";
import {PropertyType} from "../../../framework/property/prop.model";
import {Context} from "../../../framework/context";

export const slackSendMessageAction = createAction({
    name: 'send_channel_message',
    displayName: "Send Slack Message",
    description: 'Send Slack Message',
    props: [
        {
            name: 'authentication',
            description: "",
            displayName: 'Authentication',
            type: PropertyType.OAUTH2,
            authUrl: "https://slack.com/oauth/authorize",
            tokenUrl: "https://slack.com/api/oauth.access",
            required: true,
            scope: ["channels:read", "channels:write"]
        },
        {
            name: 'channel',
            displayName: 'Channel',
            description: 'Channel, private group, or IM channel to send message to. Can be an encoded ID, or a name. See [below](#channels) for more details.',
            type: PropertyType.DROPDOWN,
            required: true,
            async options(configuration) {
                return {
                    disabled: false,
                    options: [
                        {
                            label: 'random',
                            value: 'random',
                        },
                        {
                            label: 'general',
                            value: 'general',
                        },
                        {
                            label: 'technology',
                            value: 'technology',
                        },
                    ]
                }
            },
        },
        {
            name: 'text',
            displayName: 'Message',
            description: 'The text of your message',
            type: PropertyType.LONG_TEXT,
            required: true,
        },
        {
            name: 'as_user',
            displayName: 'Send as a Bot?',
            description: 'Pass true to post the message as the authed user, instead of as a bot. Defaults to false. See [authorship](#authorship) below.',
            type: PropertyType.CHECKBOX,
            required: false,
        },
        {
            name: 'username',
            displayName: 'Bot name',
            description: 'Set your bot\'s user name. Must be used in conjunction with `as_user` set to false, otherwise ignored. See [authorship](#authorship) below.',
            type: PropertyType.SHORT_TEXT,
            required: false,
        }
    ],
    async run(context: Context) {
        let configValue = context.propsValue;
        let body = {
            text: configValue['text'],
            channel: configValue['channel'],
            as_user: configValue['as_user'],
            username: configValue['username']
        };
        const request: HttpRequest<Record<string, string>> = {
            method: HttpMethod.POST,
            url: 'https://slack.com/api/chat.postMessage',
            body: body,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: configValue['authentication']['access_token'],
            },
            queryParams: {},
        };

        let result = await httpClient.sendRequest(request);

        return {
            success: true,
            request_body: body,
            response_body: result
        };
    },
});
