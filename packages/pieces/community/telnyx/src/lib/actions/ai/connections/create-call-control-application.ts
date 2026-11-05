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

export const telnyxCreateCallControlApplicationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_call_control_application',
	displayName: 'Create Call Control Application',
	description: 'Creates a call control application that sends call events to a webhook.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a call control application: the connection that places and receives programmable calls and posts call events to Webhook URL. Set Outbound Voice Profile ID (from List Outbound Voice Profiles) or Dial Call cannot reach phone numbers. Returns the application; its id is the Connection ID for Dial Call. Not idempotent.',
		idempotent: false,
	},
	props: {
		applicationName: Property.ShortText({
			displayName: 'Name',
			description: 'Application name.',
			required: true,
		}),
		webhookEventUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'URL that receives the call events of this application.',
			required: true,
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
		return await telnyxApi.createCallControlApplication({
			auth: context.auth,
			body: {
				...p.additionalFields,
				...telnyxUtils.compact({
					values: {
						application_name: p.applicationName,
						webhook_event_url: p.webhookEventUrl,
						active: p.active,
						webhook_event_failover_url: p.webhookEventFailoverUrl,
						webhook_api_version: p.webhookApiVersion,
						dtmf_type: p.dtmfType,
						webhook_timeout_secs: p.webhookTimeoutSecs,
						outbound: p.outboundVoiceProfileId
							? { outbound_voice_profile_id: p.outboundVoiceProfileId }
							: undefined,
					},
				}),
			},
		});
	},
});
