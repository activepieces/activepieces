import {AuthenticationType} from '../../../common/authentication/core/authentication-type';
import {httpClient} from '../../../common/http/core/http-client';
import {HttpMethod} from '../../../common/http/core/http-method';
import type {HttpRequest} from '../../../common/http/core/http-request';
import {createAction} from '../../../framework/action/action';
import {InputDataType} from '../../../framework/config/input-data-type.model';
import {InputRequestLocation} from '../../../framework/config/input-request-location.model';
import {InputUiType} from '../../../framework/config/input-ui-type.model';

export const slackSendMessageAction = createAction({
	name: 'Send Slack Message',
	description: 'Send Slack Message',
	url: '/chat.postMessage',
	httpMethod: HttpMethod.POST,
	configs: [
		{
			name: 'as_user',
			displayName: 'as_user',
			description: 'Pass true to post the message as the authed user, instead of as a bot. Defaults to false. See [authorship](#authorship) below.',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'attachments',
			displayName: 'attachments',
			description: 'A JSON-based array of structured attachments, presented as a URL-encoded string.',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'blocks',
			displayName: 'blocks',
			description: 'A JSON-based array of structured blocks, presented as a URL-encoded string.',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'channel',
			displayName: 'channel',
			description: 'Channel, private group, or IM channel to send message to. Can be an encoded ID, or a name. See [below](#channels) for more details.',
			uiType: InputUiType.SELECT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
			async options(auth) {
				console.log(auth);
				return [
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
				];
			},
		},
		{
			name: 'icon_emoji',
			displayName: 'icon_emoji',
			description: 'Emoji to use as the icon for this message. Overrides `icon_url`. Must be used in conjunction with `as_user` set to `false`, otherwise ignored. See [authorship](#authorship) below.',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'icon_url',
			displayName: 'icon_url',
			description: 'URL to an image to use as the icon for this message. Must be used in conjunction with `as_user` set to false, otherwise ignored. See [authorship](#authorship) below.',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'link_names',
			displayName: 'link_names',
			description: 'Find and link channel names and usernames.',
			uiType: InputUiType.BOOLEAN,
			type: InputDataType.BOOLEAN,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'mrkdwn',
			displayName: 'mrkdwn',
			description: 'Disable Slack markup parsing by setting to `false`. Enabled by default.',
			uiType: InputUiType.BOOLEAN,
			type: InputDataType.BOOLEAN,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'parse',
			displayName: 'parse',
			description: 'Change how messages are treated. Defaults to `none`. See [below](#formatting).',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'reply_broadcast',
			displayName: 'reply_broadcast',
			description: 'Used in conjunction with `thread_ts` and indicates whether reply should be made visible to everyone in the channel or conversation. Defaults to `false`.',
			uiType: InputUiType.BOOLEAN,
			type: InputDataType.BOOLEAN,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'text',
			displayName: 'text',
			description: 'How this field works and whether it is required depends on other fields you use in your API call. [See below](#text_usage) for more detail.',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'thread_ts',
			displayName: 'thread_ts',
			description: 'Provide another message\'s `ts` value to make this message a reply. Avoid using a reply\'s `ts` value; use its parent instead.',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'unfurl_links',
			displayName: 'unfurl_links',
			description: 'Pass true to enable unfurling of primarily text-based content.',
			uiType: InputUiType.BOOLEAN,
			type: InputDataType.BOOLEAN,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'unfurl_media',
			displayName: 'unfurl_media',
			description: 'Pass false to disable unfurling of media content.',
			uiType: InputUiType.BOOLEAN,
			type: InputDataType.BOOLEAN,
			in: InputRequestLocation.BODY,
			required: false,
		},
		{
			name: 'username',
			displayName: 'username',
			description: 'Set your bot\'s user name. Must be used in conjunction with `as_user` set to false, otherwise ignored. See [authorship](#authorship) below.',
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
	],
	async runner(configValue) {
		const request: HttpRequest<Record<string, string>> = {
			method: HttpMethod.POST,
			url: 'https://slack.com/api/chat.postMessage',
			body: configValue.inputs,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: configValue.authentication.accessToken,
			},
			queryParams: {},
		};

		await httpClient.sendRequest(request);

		return {
			success: true,
		};
	},
});
