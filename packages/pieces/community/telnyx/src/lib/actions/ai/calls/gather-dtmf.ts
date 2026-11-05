import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxGatherDtmfAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_gather_dtmf',
	displayName: 'Gather DTMF',
	description: 'Collects key presses from the caller without a prompt.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts collecting DTMF key presses on an answered call without playing a prompt (use Gather Using Speak or Gather Using Audio to prompt). The collected digits are not returned here: they arrive in a call.gather.ended webhook, which you can read afterwards with List Call Events (filter by the call leg). Stop early with Stop Gather.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		minimumDigits: Property.Number({
			displayName: 'Minimum Digits',
			description: 'Fewest digits to gather. Defaults to 1.',
			required: false,
		}),
		maximumDigits: Property.Number({
			displayName: 'Maximum Digits',
			description: 'Most digits to gather (up to 128). Defaults to 128.',
			required: false,
		}),
		timeoutMillis: Property.Number({
			displayName: 'Timeout (ms)',
			description: 'Milliseconds to wait for the full input. Defaults to 60000.',
			required: false,
		}),
		interDigitTimeoutMillis: Property.Number({
			displayName: 'Inter-Digit Timeout (ms)',
			description: 'Milliseconds to wait between digits. Defaults to 5000.',
			required: false,
		}),
		terminatingDigit: Property.ShortText({
			displayName: 'Terminating Digit',
			description: 'Digit that ends input, e.g. "#". Defaults to #.',
			required: false,
		}),
		validDigits: Property.ShortText({
			displayName: 'Valid Digits',
			description:
				'Digits to accept, e.g. "0123456789". Others are ignored. Defaults to 0123456789#*.',
			required: false,
		}),
		initialTimeoutMillis: Property.Number({
			displayName: 'Initial Timeout (ms)',
			description: 'Milliseconds to wait for the first digit. Defaults to 5000.',
			required: false,
		}),
		gatherId: Property.ShortText({
			displayName: 'Gather ID',
			description: 'Optional id echoed in the gather webhook so you can match it.',
			required: false,
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'gather',
			body: telnyxUtils.compact({
				values: {
					minimum_digits: p.minimumDigits,
					maximum_digits: p.maximumDigits,
					timeout_millis: p.timeoutMillis,
					inter_digit_timeout_millis: p.interDigitTimeoutMillis,
					terminating_digit: p.terminatingDigit,
					valid_digits: p.validDigits,
					initial_timeout_millis: p.initialTimeoutMillis,
					gather_id: p.gatherId,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
