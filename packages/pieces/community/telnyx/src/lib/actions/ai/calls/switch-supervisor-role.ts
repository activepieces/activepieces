import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSwitchSupervisorRoleAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_switch_supervisor_role',
	displayName: 'Switch Supervisor Role',
	description: 'Changes how a supervisor leg takes part in a bridged call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Switches a supervisor call leg (bridged into an agent call) between barge (talk to both), whisper (talk to the agent only) and monitor (listen only). Repeating the same role changes nothing.',
		idempotent: true,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		role: Property.StaticDropdown({
			displayName: 'Role',
			description: 'barge talks to both parties, whisper only to the agent, monitor only listens.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'barge', value: 'barge' },
					{ label: 'whisper', value: 'whisper' },
					{ label: 'monitor', value: 'monitor' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'switch_supervisor_role',
			body: telnyxUtils.compact({
				values: {
					role: p.role,
				},
			}),
		});
	},
});
