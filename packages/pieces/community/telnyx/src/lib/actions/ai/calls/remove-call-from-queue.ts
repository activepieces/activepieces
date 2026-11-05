import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxRemoveCallFromQueueAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_remove_call_from_queue',
	displayName: 'Remove Call From Queue',
	description: 'Takes a call out of its queue.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes a call from the queue it was placed in with Enqueue Call; the call stays connected.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'leave_queue',
			body: telnyxUtils.compact({
				values: {
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
