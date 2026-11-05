import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxBridgeCallsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_bridge_calls',
	displayName: 'Bridge Calls',
	description: 'Connects two active calls so both parties can talk.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Bridges two answered calls together (both call_control_ids from Dial Call or List Active Calls). Fails if either call is not active.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		otherCallControlId: Property.ShortText({
			displayName: 'Other Call Control ID',
			description: 'call_control_id of the second call to bridge with.',
			required: true,
		}),
		parkAfterUnbridge: Property.StaticDropdown({
			displayName: 'Park After Unbridge',
			description: 'Which leg to keep (park) when the other hangs up instead of hanging up both.',
			required: false,
			options: {
				disabled: false,
				options: [{ label: 'self', value: 'self' }],
			},
		}),
		playRingtone: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Play Ringtone',
			description:
				'Whether to play a ringtone to the first call until the bridge completes. Defaults to No.',
		}),
		preventDoubleBridge: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Prevent Double Bridge',
			description: 'Whether to fail if the other call is already bridged. Defaults to No.',
		}),
		record: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Record From Answer',
			description: 'Whether to record the call from the moment it is answered.',
		}),
		recordFormat: Property.StaticDropdown({
			displayName: 'Recording Format',
			description: 'Recording file format when Record From Answer is Yes. Defaults to mp3.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'mp3', value: 'mp3' },
					{ label: 'wav', value: 'wav' },
				],
			},
		}),
		recordChannels: Property.StaticDropdown({
			displayName: 'Recording Channels',
			description:
				'single mixes both legs; dual keeps each leg on its own channel. Defaults to dual.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'single', value: 'single' },
					{ label: 'dual', value: 'dual' },
				],
			},
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'bridge',
			body: telnyxUtils.compact({
				values: {
					call_control_id: p.otherCallControlId,
					park_after_unbridge: p.parkAfterUnbridge,
					play_ringtone: p.playRingtone,
					prevent_double_bridge: p.preventDoubleBridge,
					record: p.record ? 'record-from-answer' : undefined,
					record_format: p.recordFormat,
					record_channels: p.recordChannels,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
