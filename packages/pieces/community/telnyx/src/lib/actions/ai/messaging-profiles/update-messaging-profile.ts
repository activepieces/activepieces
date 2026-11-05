import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateMessagingProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_messaging_profile',
	displayName: 'Update Messaging Profile',
	description: 'Updates a messaging profile, keeping every setting you leave empty.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a messaging profile. Only the fields you set are sent; everything else keeps its value. Allowed Destinations and the JSON settings replace the stored value as a whole.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Profile name.',
			required: false,
		}),
		whitelistedDestinations: Property.Array({
			displayName: 'Allowed Destinations',
			description:
				'ISO 3166-1 alpha-2 country codes this profile may send to, e.g. ["US","CA"]; ["*"] allows all. Replaces the whole list.',
			required: false,
		}),
		enabled: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Enabled',
			description: 'Whether the profile can send and receive messages.',
		}),
		webhookUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'URL that receives message webhooks for numbers on this profile.',
			required: false,
		}),
		webhookFailoverUrl: Property.ShortText({
			displayName: 'Webhook Failover URL',
			description: 'Failover URL for message webhooks.',
			required: false,
		}),
		webhookApiVersion: Property.StaticDropdown({
			displayName: 'Webhook API Version',
			description: 'Webhook format sent for this profile. Defaults to 2.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: '2', value: '2' },
					{ label: '1', value: '1' },
					{ label: '2010-04-01 (TeXML)', value: '2010-04-01' },
				],
			},
		}),
		alphaSender: Property.ShortText({
			displayName: 'Alphanumeric Sender',
			description: 'Alphanumeric sender ID used when sending from this profile.',
			required: false,
		}),
		dailySpendLimit: Property.ShortText({
			displayName: 'Daily Spend Limit',
			description:
				'Maximum USD spend per day as a decimal string, e.g. "100.00". Takes effect when Daily Spend Limit Enabled is Yes.',
			required: false,
		}),
		dailySpendLimitEnabled: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Daily Spend Limit Enabled',
			description: 'Whether the daily spend limit is enforced.',
		}),
		mmsFallBackToSms: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'MMS Fallback to SMS',
			description:
				'Whether to fall back to SMS with a media link when the destination cannot receive MMS.',
		}),
		mmsTranscoding: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'MMS Transcoding',
			description: 'Whether to resize media for carrier limits.',
		}),
		mobileOnly: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Mobile Only',
			description: 'Whether to send only to mobile numbers.',
		}),
		smartEncoding: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Smart Encoding',
			description: 'Whether to replace Unicode characters with GSM-7 equivalents to save segments.',
		}),
		numberPoolSettings: Property.Json({
			displayName: 'Number Pool Settings',
			description:
				'Optional JSON object enabling the number pool, e.g. {"long_code_weight":1,"toll_free_weight":0,"skip_unhealthy":true,"sticky_sender":false,"geomatch":false}.',
			required: false,
		}),
		urlShortenerSettings: Property.Json({
			displayName: 'URL Shortener Settings',
			description:
				'Optional JSON object, e.g. {"domain":"example.ex","prefix":"","replace_blacklist_only":true,"send_webhooks":false}.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updateMessagingProfile({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			body: telnyxUtils.compact({
				values: {
					name: p.name,
					whitelisted_destinations: p.whitelistedDestinations,
					enabled: p.enabled,
					webhook_url: p.webhookUrl,
					webhook_failover_url: p.webhookFailoverUrl,
					webhook_api_version: p.webhookApiVersion,
					alpha_sender: p.alphaSender,
					daily_spend_limit: p.dailySpendLimit,
					daily_spend_limit_enabled: p.dailySpendLimitEnabled,
					mms_fall_back_to_sms: p.mmsFallBackToSms,
					mms_transcoding: p.mmsTranscoding,
					mobile_only: p.mobileOnly,
					smart_encoding: p.smartEncoding,
					number_pool_settings: p.numberPoolSettings,
					url_shortener_settings: p.urlShortenerSettings,
				},
			}),
		});
	},
});
