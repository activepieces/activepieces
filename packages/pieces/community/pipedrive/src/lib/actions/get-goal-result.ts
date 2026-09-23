import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { getGoalResultActionOutputSchema } from '../output-schemas';

export const getGoalResultAction = createAction({
	auth: pipedriveAuth,
	name: 'get-goal-result',
	outputSchema: getGoalResultActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Goal Result',
	description: 'Retrieves the progress of a Pipedrive goal over a period.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one goal\'s progress over a date range - the goal definition with its target, plus progress, the actual count or sum reached in that range. Both period dates are required and must fall inside the goal\'s own duration, or Pipedrive rejects the request. Get the goal ID from Find Goals. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		goalId: Property.ShortText({
			displayName: 'Goal ID',
			description: 'The 32-character hexadecimal goal ID (from Find Goals or Add Goal).',
			required: true,
		}),
		periodStart: Property.ShortText({
			displayName: 'Period Start',
			description:
				'The first day of the period to measure, as YYYY-MM-DD. Must fall inside the goal duration.',
			required: true,
		}),
		periodEnd: Property.ShortText({
			displayName: 'Period End',
			description:
				'The last day of the period to measure, as YYYY-MM-DD. Must fall inside the goal duration.',
			required: true,
		}),
	},
	async run(context) {
		const { periodStart, periodEnd } = context.propsValue;
		const goalId = pipedriveAtomic.assertGoalId(context.propsValue.goalId);
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v1/goals/${goalId}/results`,
			resourceLabel: `results of goal ${goalId}`,
			query: {
				'period.start': periodStart,
				'period.end': periodEnd,
			},
		});
	},
});
