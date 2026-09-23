import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { updateGoalActionOutputSchema } from '../output-schemas';

export const updateGoalAction = createAction({
	auth: pipedriveAuth,
	name: 'update-goal',
	outputSchema: updateGoalActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Update Goal',
	description: 'Updates an existing Pipedrive goal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing goal\'s title, assignee, target, duration or interval. Omitted fields are left unchanged. Get the goal ID from Find Goals. Re-applying the same values converges on the same state.',
		idempotent: true,
	},
	props: {
		goalId: Property.ShortText({
			displayName: 'Goal ID',
			description: 'The 32-character hexadecimal goal ID (from Find Goals or Add Goal).',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The new name of the goal. Leave empty to keep the current title.',
			required: false,
		}),
		assigneeId: Property.Number({
			displayName: 'Assignee ID',
			description:
				'The numeric ID of the user, team or company to reassign the goal to. Assignee Type must be supplied with it.',
			required: false,
		}),
		assigneeType: Property.StaticDropdown<string>({
			displayName: 'Assignee Type',
			description: 'What the Assignee ID refers to. Assignee ID must be supplied with it.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Person', value: 'person' },
					{ label: 'Company', value: 'company' },
					{ label: 'Team', value: 'team' },
				],
			},
		}),
		goalType: Property.StaticDropdown<string>({
			displayName: 'Goal Type',
			description:
				'What the goal measures. Leave empty to keep the current type. Pipedrive keeps the goal\'s current pipeline and stage settings unless new ones are supplied; switching to Deals Progressed needs a Stage ID if the goal has none.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Deals Won', value: 'deals_won' },
					{ label: 'Deals Progressed', value: 'deals_progressed' },
					{ label: 'Deals Started', value: 'deals_started' },
					{ label: 'Activities Completed', value: 'activities_completed' },
					{ label: 'Activities Added', value: 'activities_added' },
					{ label: 'Revenue Forecast', value: 'revenue_forecast' },
				],
			},
		}),
		pipelineId: Property.Number({
			displayName: 'Pipeline ID',
			description: 'The pipeline ID the goal tracks (from List Pipelines). Only sent together with Goal Type.',
			required: false,
		}),
		stageId: Property.Number({
			displayName: 'Stage ID',
			description: 'The stage ID a deal must reach to count (from List Stages). Only sent together with Goal Type.',
			required: false,
		}),
		activityTypeId: Property.Number({
			displayName: 'Activity Type ID',
			description: 'Restrict an activity goal to this activity type ID (from List Activity Types). Only sent together with Goal Type.',
			required: false,
		}),
		target: Property.Number({
			displayName: 'Target',
			description:
				'The new numeric value the goal aims to reach. Tracking Metric must be supplied with it.',
			required: false,
		}),
		trackingMetric: Property.StaticDropdown<string>({
			displayName: 'Tracking Metric',
			description: 'Quantity counts records; Sum adds up their values. Target must be supplied with it.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Quantity', value: 'quantity' },
					{ label: 'Sum', value: 'sum' },
				],
			},
		}),
		currencyId: Property.Number({
			displayName: 'Currency ID',
			description: 'Pipedrive\'s numeric currency ID (not the 3-letter code), as in currency_id on an existing Sum goal from Find Goals. Needed when switching a goal to Sum if it has no currency yet.',
			required: false,
		}),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description:
				'The new start date of the goal, as YYYY-MM-DD. Required when End Date is supplied.',
			required: false,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'The new end date of the goal, as YYYY-MM-DD. Leave empty to keep the current end date.',
			required: false,
		}),
		interval: Property.StaticDropdown<string>({
			displayName: 'Interval',
			description: 'How often the goal resets. Leave empty to keep the current interval.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Weekly', value: 'weekly' },
					{ label: 'Monthly', value: 'monthly' },
					{ label: 'Quarterly', value: 'quarterly' },
					{ label: 'Yearly', value: 'yearly' },
				],
			},
		}),
	},
	async run(context) {
		const props = context.propsValue;
		const startDate = pipedriveAtomic.emptyToUndefined(props.startDate);
		const endDate = pipedriveAtomic.emptyToUndefined(props.endDate);
		const hasAssigneeId = props.assigneeId !== undefined && props.assigneeId !== null;
		const hasAssigneeType = props.assigneeType !== undefined && props.assigneeType !== null;
		if (hasAssigneeId !== hasAssigneeType) {
			throw new Error('Assignee ID and Assignee Type must be supplied together.');
		}
		const hasTarget = props.target !== undefined && props.target !== null;
		const hasMetric = props.trackingMetric !== undefined && props.trackingMetric !== null;
		if (hasTarget !== hasMetric) {
			throw new Error('Target and Tracking Metric must be supplied together.');
		}
		if (endDate !== undefined && startDate === undefined) {
			throw new Error('Start Date is required when End Date is supplied.');
		}
		const hasGoalType = props.goalType !== undefined && props.goalType !== null;
		const goalId = pipedriveAtomic.assertGoalId(props.goalId);
		const typeParams = pipedriveAtomic.buildGoalTypeParams({
			pipelineId: props.pipelineId,
			stageId: props.stageId,
			activityTypeId: props.activityTypeId,
		});
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/v1/goals/${goalId}`,
			resourceLabel: `Goal ${goalId}`,
			body: {
				title: pipedriveAtomic.emptyToUndefined(props.title),
				assignee: hasAssigneeId ? { id: props.assigneeId, type: props.assigneeType } : undefined,
				type: hasGoalType ? { name: props.goalType, params: typeParams } : undefined,
				expected_outcome: hasTarget
					? {
							target: props.target,
							tracking_metric: props.trackingMetric,
							currency_id: props.trackingMetric === 'sum' ? props.currencyId : undefined,
					  }
					: undefined,
				duration: startDate !== undefined ? { start: startDate, end: endDate } : undefined,
				interval: props.interval,
			},
		});
	},
});
