import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';

export const deleteGoalAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-goal',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Goal',
	description: 'Marks a Pipedrive goal as deleted.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Marks one goal as deleted by its ID. This cannot be undone from this piece; to stop tracking without deleting, shorten the goal\'s end date with Update Goal. Not safe to retry blindly.',
		idempotent: false,
	},
	props: {
		goalId: Property.ShortText({
			displayName: 'Goal ID',
			description: 'The 32-character hexadecimal ID of the goal to delete (from Find Goals).',
			required: true,
		}),
	},
	async run(context) {
		const goalId = pipedriveAtomic.assertGoalId(context.propsValue.goalId);
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v1/goals/${goalId}`,
			resourceLabel: `Goal ${goalId}`,
		});
	},
});
