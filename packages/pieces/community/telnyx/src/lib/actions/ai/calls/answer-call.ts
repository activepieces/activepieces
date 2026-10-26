import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxAnswerCallAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_answer_call',
	displayName: 'Answer Call',
	description: 'Answers an incoming call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Answers an incoming call that is ringing on a call control application. The call_control_id comes from the call.initiated webhook or List Active Calls. Optionally starts recording from answer. Fails if the call was already answered or has ended.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		webhookUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description:
				"Optional URL that receives this call's webhooks instead of the application's default.",
			required: false,
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
			command: 'answer',
			body: telnyxUtils.compact({
				values: {
					webhook_url: p.webhookUrl,
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
