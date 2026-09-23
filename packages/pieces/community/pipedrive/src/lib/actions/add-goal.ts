import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { addGoalActionOutputSchema } from '../output-schemas';

export const addGoalAction = createAction({
	auth: pipedriveAuth,
	name: 'add-goal',
	outputSchema: addGoalActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Add Goal',
	description: 'Creates a Pipedrive goal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Pipedrive goal for a user, team or the whole company - for example "close 20 deals this quarter". Pipedrive requires a pipeline, a start and an end date on every goal, a stage for Deals Progressed goals and a currency when Tracking Metric is Sum. Use Find Goals first to avoid creating a duplicate. Creates a new record on every call.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The name of the goal.',
			required: true,
		}),
		assigneeId: Property.Number({
			displayName: 'Assignee ID',
			description:
				'The numeric ID of the user, team or company the goal is assigned to (from List Users for a person).',
			required: true,
		}),
		assigneeType: Property.StaticDropdown<string>({
			displayName: 'Assignee Type',
			description: 'What the Assignee ID refers to.',
			required: true,
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
			description: 'What the goal measures.',
			required: true,
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
			description: 'The pipeline ID the goal tracks (from List Pipelines). Required by Pipedrive for every goal type.',
			required: true,
		}),
		stageId: Property.Number({
			displayName: 'Stage ID',
			description:
				'The stage ID a deal must reach to count (from List Stages). Required for Deals Progressed goals, ignored otherwise.',
			required: false,
		}),
		activityTypeId: Property.Number({
			displayName: 'Activity Type ID',
			description:
				'Restrict the goal to this activity type ID (from List Activity Types). Only applies to activity goals.',
			required: false,
		}),
		target: Property.Number({
			displayName: 'Target',
			description: 'The numeric value the goal aims to reach.',
			required: true,
		}),
		trackingMetric: Property.StaticDropdown<string>({
			displayName: 'Tracking Metric',
			description: 'Quantity counts records; Sum adds up their values.',
			required: true,
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
			description: 'Pipedrive\'s numeric currency ID (not the 3-letter code), as in currency_id on an existing Sum goal from Find Goals. Required when Tracking Metric is Sum.',
			required: false,
		}),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'The date the goal starts, as YYYY-MM-DD.',
			required: true,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'The date the goal ends, as YYYY-MM-DD. Required by Pipedrive.',
			required: true,
		}),
		interval: Property.StaticDropdown<string>({
			displayName: 'Interval',
			description: 'How often the goal resets over its duration.',
			required: true,
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
		if (props.goalType === 'deals_progressed' && isNil(props.stageId)) {
			throw new Error('Stage ID is required for Deals Progressed goals.');
		}
		if (props.trackingMetric === 'sum' && isNil(props.currencyId)) {
			throw new Error('Currency ID is required when Tracking Metric is Sum.');
		}
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: '/v1/goals',
			resourceLabel: 'goals',
			body: {
				title: props.title,
				assignee: { id: props.assigneeId, type: props.assigneeType },
				type: {
					name: props.goalType,
					params: pipedriveAtomic.buildGoalTypeParams({
						pipelineId: props.pipelineId,
						stageId: props.stageId,
						activityTypeId: props.activityTypeId,
					}),
				},
				expected_outcome: {
					target: props.target,
					tracking_metric: props.trackingMetric,
					currency_id: props.trackingMetric === 'sum' ? props.currencyId : undefined,
				},
				duration: {
					start: props.startDate,
					end: props.endDate,
				},
				interval: props.interval,
			},
		});
	},
});
