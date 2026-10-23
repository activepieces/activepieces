import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

const WEBHOOK_VERSION_OPTIONS = [
	{ label: 'Version 2', value: '2' },
	{ label: 'Version 1', value: '1' },
];

const DTMF_OPTIONS = [
	{ label: 'RFC 2833', value: 'RFC 2833' },
	{ label: 'Inband', value: 'Inband' },
	{ label: 'SIP INFO', value: 'SIP INFO' },
];

export const telnyxUpdateCallControlApplicationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_call_control_application',
	displayName: 'Update Call Control Application',
	description: 'Updates a call control application, keeping every field you leave empty.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a call control application, changing only the fields you set. Reads the application first because the API requires its name and webhook URL on every update; a new Outbound Voice Profile ID is merged into the existing outbound settings. Not safe against a concurrent edit of the same application.',
		idempotent: true,
	},
	props: {
		applicationId: Property.ShortText({
			displayName: 'Application ID',
			description: 'Call control application ID. Use List Call Control Applications to find it.',
			required: true,
		}),
		applicationName: Property.ShortText({
			displayName: 'Name',
			description: 'New application name.',
			required: false,
		}),
		webhookEventUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'New URL for call events.',
			required: false,
		}),
		active: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Active',
			description: 'Whether the application accepts and places calls.',
		}),
		outboundVoiceProfileId: Property.ShortText({
			displayName: 'Outbound Voice Profile ID',
			description:
				'Outbound voice profile used for calls placed through this application; required to dial phone numbers. Use List Outbound Voice Profiles to find it.',
			required: false,
		}),
		webhookEventFailoverUrl: Property.ShortText({
			displayName: 'Webhook Failover URL',
			description: 'Failover URL for call webhooks.',
			required: false,
		}),
		webhookApiVersion: Property.StaticDropdown({
			displayName: 'Webhook API Version',
			description: 'Webhook payload version. Defaults to 2.',
			required: false,
			options: { disabled: false, options: WEBHOOK_VERSION_OPTIONS },
		}),
		dtmfType: Property.StaticDropdown({
			displayName: 'DTMF Type',
			description: 'How DTMF digits are sent. Defaults to RFC 2833.',
			required: false,
			options: { disabled: false, options: DTMF_OPTIONS },
		}),
		webhookTimeoutSecs: Property.Number({
			displayName: 'Webhook Timeout (seconds)',
			description: 'Seconds Telnyx waits for your webhook to respond.',
			required: false,
		}),
		additionalFields: Property.Json({
			displayName: 'Additional Fields',
			description:
				'Optional JSON object of other application settings, e.g. {"anchorsite_override": "Chicago, IL", "inbound": {"channel_limit": 10}}. The fields above take precedence.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const current = await telnyxApi.getCallControlApplication({
			auth: context.auth,
			applicationId: p.applicationId,
		});
		return await telnyxApi.updateCallControlApplication({
			auth: context.auth,
			applicationId: p.applicationId,
			body: {
				...p.additionalFields,
				...telnyxUtils.compact({
					values: {
						application_name: p.applicationName ?? current?.application_name,
						webhook_event_url: p.webhookEventUrl ?? current?.webhook_event_url,
						active: p.active,
						webhook_event_failover_url: p.webhookEventFailoverUrl,
						webhook_api_version: p.webhookApiVersion,
						dtmf_type: p.dtmfType,
						webhook_timeout_secs: p.webhookTimeoutSecs,
						outbound: p.outboundVoiceProfileId
							? {
									...current?.outbound,
									outbound_voice_profile_id: p.outboundVoiceProfileId,
							  }
							: undefined,
					},
				}),
			},
		});
	},
});
