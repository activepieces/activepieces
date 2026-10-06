import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { getActivityActionOutputSchema } from '../output-schemas';

export const getActivityAction = createAction({
	auth: pipedriveAuth,
	name: 'get-activity',
	outputSchema: getActivityActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Activity',
	description: 'Retrieves an activity by its ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one activity (call, meeting, task, etc.) by numeric ID, including its attendees and linked deal, lead, person and organization. Use when you already hold the activity ID; to browse activities of a deal or person use List Activities, and for an exact single-field match use Find Activity. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		activityId: Property.Number({
			displayName: 'Activity ID',
			description: 'The numeric activity ID (from List Activities or an activity trigger).',
			required: true,
		}),
	},
	async run(context) {
		const { activityId } = context.propsValue;
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v2/activities/${activityId}`,
			resourceLabel: `Activity ${activityId}`,
			query: { include_fields: 'attendees' },
		});
	},
});
