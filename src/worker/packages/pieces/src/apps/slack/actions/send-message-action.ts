import {AuthenticationType} from '../../../common/authentication/core/authentication-type';
import {HttpMethod} from '../../../common/http/core/http-method';
import type {HttpRequest} from '../../../common/http/core/http-request';
import {createAction} from '../../../framework/action/action';
import {httpClient} from "../../../common/http/core/http-client";;
import {Props} from "../../../framework/property/prop.model";

export const slackSendMessageAction = createAction({
    name: 'send_channel_message',
    displayName: "Send Slack Message",
    description: 'Send Slack Message',
    props: {
        authentication: Props.OAuth2({
            description: "",
            displayName: 'Authentication',
            authUrl: "https://slack.com/oauth/authorize",
            tokenUrl: "https://slack.com/api/oauth.access",
            required: true,
            scope: ["channels:read", "channels:write"]
        }),
        channel: Props.Dropdown({
            displayName: 'Channel',
            description: 'Channel, private group, or IM channel to send message to. Can be an encoded ID, or a name. See [below](#channels) for more details.',
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
        }),
        text: Props.LongText({
            displayName: 'Message',
            description: 'The text of your message',
            required: true,
        }),
        as_user: Props.LongText({
            displayName: 'Send as a Bot?',
            description: 'Pass true to post the message as the authed user, instead of as a bot. Defaults to false. See [authorship](#authorship) below.',
            required: true,
        }),
        username: Props.ShortText({
            displayName: 'Bot name',
            description: 'Set your bot\'s user name. Must be used in conjunction with `as_user` set to false, otherwise ignored. See [authorship](#authorship) below.',
            required: false,
        })
    },
    async run(context) {
        let configValue = context.propsValue;
        let body: Record<string, unknown> = {
            text: configValue['text'],
            channel: configValue['channel'],
            as_user: configValue['as_user'],
            username: configValue['username']
        };
        const request: HttpRequest<Record<string, unknown>> = {
            method: HttpMethod.POST,
            url: 'https://slack.com/api/chat.postMessage',
            body: body,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: configValue['authentication']!['access_token'],
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
