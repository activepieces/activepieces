import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveAtomicQuery, PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { findGoalsActionOutputSchema } from '../output-schemas';

export const findGoalsAction = createAction({
	auth: pipedriveAuth,
	name: 'find-goals',
	outputSchema: findGoalsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find Goals',
	description: 'Finds Pipedrive goals matching the supplied filters.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds goals matching any combination of title, type, assignee, target, stage or period. Use it to resolve a goal ID before Get Goal Result or Update Goal; to list every goal, filter by Active. Pipedrive requires at least one filter. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Only goals whose title matches this text.',
			required: false,
		}),
		goalType: Property.StaticDropdown<string>({
			displayName: 'Goal Type',
			description: 'Only goals of this type.',
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
		isActive: Property.StaticDropdown<boolean>({
			displayName: 'Active',
			description: 'Yes returns only currently active goals. Leave empty for both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: true },
					{ label: 'No', value: false },
				],
			},
		}),
		assigneeId: Property.Number({
			displayName: 'Assignee ID',
			description: 'Only goals assigned to this user, team or company ID.',
			required: false,
		}),
		assigneeType: Property.StaticDropdown<string>({
			displayName: 'Assignee Type',
			description: 'What the Assignee ID refers to.',
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
		target: Property.Number({
			displayName: 'Target',
			description: 'Only goals with this target value.',
			required: false,
		}),
		trackingMetric: Property.StaticDropdown<string>({
			displayName: 'Tracking Metric',
			description: 'Only goals tracked by this metric.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Quantity', value: 'quantity' },
					{ label: 'Sum', value: 'sum' },
				],
			},
		}),
		stageId: Property.Number({
			displayName: 'Stage ID',
			description: 'Only Deals Progressed goals scoped to this stage ID (from List Stages).',
			required: false,
		}),
		periodStart: Property.ShortText({
			displayName: 'Period Start',
			description: 'Only goals whose period starts on or after this date, as YYYY-MM-DD.',
			required: false,
		}),
		periodEnd: Property.ShortText({
			displayName: 'Period End',
			description: 'Only goals whose period ends on or before this date, as YYYY-MM-DD.',
			required: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;
		const query: PipedriveAtomicQuery = {
			title: pipedriveAtomic.emptyToUndefined(props.title),
			'type.name': props.goalType,
			is_active: props.isActive,
			'assignee.id': props.assigneeId,
			'assignee.type': props.assigneeType,
			'expected_outcome.target': props.target,
			'expected_outcome.tracking_metric': props.trackingMetric,
			'type.params.stage_id': props.stageId,
			'period.start': pipedriveAtomic.emptyToUndefined(props.periodStart),
			'period.end': pipedriveAtomic.emptyToUndefined(props.periodEnd),
		};
		const hasFilter = Object.values(query).some(
			(value) => value !== undefined && value !== null,
		);
		if (!hasFilter) {
			throw new Error('Find Goals requires at least one filter.');
		}
		const response = await pipedriveAtomic.call<
			PipedriveEnvelope<{ goals?: Record<string, unknown>[] } | null>
		>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v1/goals/find',
			resourceLabel: 'goals',
			query,
		});
		const data = response.data?.goals ?? [];
		return { found: data.length > 0, data };
	},
});
