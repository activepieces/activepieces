import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxEnqueueCallAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_enqueue_call',
	displayName: 'Enqueue Call',
	description: 'Places an active call in a waiting queue.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Puts an answered call into a named queue to wait (the queue is created if it does not exist). Connect it later with Bridge Calls, or take it out with Remove Call From Queue. See waiting calls with List Queue Calls.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		queueName: Property.ShortText({
			displayName: 'Queue Name',
			description: 'Name of the queue, e.g. "support".',
			required: true,
		}),
		maxWaitTimeSecs: Property.Number({
			displayName: 'Max Wait (seconds)',
			description: 'Remove the call from the queue after this many seconds.',
			required: false,
		}),
		maxSize: Property.Number({
			displayName: 'Max Queue Size',
			description: 'Maximum calls in the queue when it is created here (1-5000). Defaults to 100.',
			required: false,
		}),
		keepAfterHangup: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Keep After Hangup',
			description: 'Whether the call stays in the queue after the caller hangs up. Defaults to No.',
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'enqueue',
			body: telnyxUtils.compact({
				values: {
					queue_name: p.queueName,
					max_wait_time_secs: p.maxWaitTimeSecs,
					max_size: p.maxSize,
					keep_after_hangup: p.keepAfterHangup,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
