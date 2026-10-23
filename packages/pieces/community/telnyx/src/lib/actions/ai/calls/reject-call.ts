import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxRejectCallAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_reject_call',
	displayName: 'Reject Call',
	description: 'Rejects an incoming call without answering it.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Rejects an incoming, unanswered call with a SIP cause such as busy. Use Hang Up Call for calls that are already answered.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		cause: Property.StaticDropdown({
			displayName: 'Cause',
			description: 'Reason sent to the caller.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'CALL_REJECTED', value: 'CALL_REJECTED' },
					{ label: 'USER_BUSY', value: 'USER_BUSY' },
					{ label: 'NOT_FOUND', value: 'NOT_FOUND' },
					{ label: 'TEMPORARILY_UNAVAILABLE', value: 'TEMPORARILY_UNAVAILABLE' },
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
			command: 'reject',
			body: telnyxUtils.compact({
				values: {
					cause: p.cause,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
