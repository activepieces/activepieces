import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateVerifyProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_verify_profile',
	displayName: 'Update Verify Profile',
	description: 'Updates a Verify profile, keeping every field you leave empty.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a Verify profile, sending only the fields you set. SMS Settings and Call Settings replace the whole channel object, so pass the full object from Get Verify Profile with your edits. Flash call settings cannot be changed through this endpoint.',
		idempotent: true,
	},
	props: {
		verifyProfileId: Property.ShortText({
			displayName: 'Verify Profile ID',
			description: 'Verify profile UUID. Use List Verify Profiles to find it.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New profile name.',
			required: false,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Language of the verification messages, e.g. "en-US".',
			required: false,
		}),
		webhookUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'URL that receives verification status webhooks.',
			required: false,
		}),
		webhookFailoverUrl: Property.ShortText({
			displayName: 'Webhook Failover URL',
			description: 'Failover URL for verification status webhooks.',
			required: false,
		}),
		sms: Property.Json({
			displayName: 'SMS Settings',
			description:
				'SMS channel settings as a JSON object, e.g. {"messaging_template_id": "...", "app_name": "Acme", "code_length": 6, "default_verification_timeout_secs": 300, "whitelisted_destinations": ["US"]}. Sent as given and replaces the existing SMS settings; start from Get Verify Profile when editing.',
			required: false,
		}),
		call: Property.Json({
			displayName: 'Call Settings',
			description:
				'Call channel settings as a JSON object, e.g. {"app_name": "Acme", "code_length": 6, "default_verification_timeout_secs": 300, "whitelisted_destinations": ["US"]}. Sent as given and replaces the existing call settings.',
			required: false,
		}),
		dailySpendLimitEnabled: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Daily Spend Limit Enabled',
			description: 'Whether the daily spend limit applies.',
		}),
		dailySpendLimit: Property.Number({
			displayName: 'Daily Spend Limit',
			description: 'Maximum daily spend in USD for this profile.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updateVerifyProfile({
			auth: context.auth,
			verifyProfileId: p.verifyProfileId,
			body: telnyxUtils.compact({
				values: {
					name: p.name,
					language: p.language,
					webhook_url: p.webhookUrl,
					webhook_failover_url: p.webhookFailoverUrl,
					sms: p.sms,
					call: p.call,
					daily_spend_limit_enabled: p.dailySpendLimitEnabled,
					daily_spend_limit: p.dailySpendLimit,
				},
			}),
		});
	},
});
