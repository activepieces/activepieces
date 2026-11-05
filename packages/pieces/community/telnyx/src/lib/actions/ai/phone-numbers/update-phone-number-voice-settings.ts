import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdatePhoneNumberVoiceSettingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_phone_number_voice_settings',
	displayName: 'Update Phone Number Voice Settings',
	description:
		'Updates the voice settings of a phone number, keeping every setting you leave empty.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates a phone number's voice settings. Only the fields you set are sent. The JSON settings (call forwarding, CNAM listing, media features, call recording) replace that whole object; read the current values with Get Phone Number Voice Settings first.",
		idempotent: true,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
		inboundCallScreening: Property.StaticDropdown({
			displayName: 'Inbound Call Screening',
			description: 'How to handle calls flagged as spam.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Disabled', value: 'disabled' },
					{ label: 'Reject calls', value: 'reject_calls' },
					{ label: 'Flag calls', value: 'flag_calls' },
				],
			},
		}),
		usagePaymentMethod: Property.StaticDropdown({
			displayName: 'Usage Payment Method',
			description: 'How inbound calls are billed.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Pay per minute', value: 'pay-per-minute' },
					{ label: 'Channel', value: 'channel' },
				],
			},
		}),
		callerIdNameEnabled: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Caller ID Name Enabled',
			description: 'Whether to look up caller ID names (CNAM) on inbound calls.',
		}),
		techPrefixEnabled: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Tech Prefix Enabled',
			description: 'Whether a tech prefix is sent on inbound calls.',
		}),
		translatedNumber: Property.ShortText({
			displayName: 'Translated Number',
			description: 'Number to present instead of the dialed number on inbound calls.',
			required: false,
		}),
		callForwarding: Property.Json({
			displayName: 'Call Forwarding',
			description:
				'Optional JSON object, e.g. {"call_forwarding_enabled":true,"forwards_to":"+13125550003","forwarding_type":"always"}.',
			required: false,
		}),
		cnamListing: Property.Json({
			displayName: 'CNAM Listing',
			description:
				'Optional JSON object, e.g. {"cnam_listing_enabled":true,"cnam_listing_details":"ACME"}.',
			required: false,
		}),
		mediaFeatures: Property.Json({
			displayName: 'Media Features',
			description:
				'Optional JSON object, e.g. {"rtp_auto_adjust_enabled":true,"accept_any_rtp_packets_enabled":false,"t38_fax_gateway_enabled":false}.',
			required: false,
		}),
		callRecording: Property.Json({
			displayName: 'Call Recording',
			description:
				'Optional JSON object, e.g. {"inbound_call_recording_enabled":true,"inbound_call_recording_format":"mp3","inbound_call_recording_channels":"single"}.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updatePhoneNumberVoiceSettings({
			auth: context.auth,
			phoneNumberId: p.phoneNumberId,
			body: telnyxUtils.compact({
				values: {
					inbound_call_screening: p.inboundCallScreening,
					usage_payment_method: p.usagePaymentMethod,
					caller_id_name_enabled: p.callerIdNameEnabled,
					tech_prefix_enabled: p.techPrefixEnabled,
					translated_number: p.translatedNumber,
					call_forwarding: p.callForwarding,
					cnam_listing: p.cnamListing,
					media_features: p.mediaFeatures,
					call_recording: p.callRecording,
				},
			}),
		});
	},
});
