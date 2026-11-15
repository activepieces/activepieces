import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { deleteRecordActionOutputSchema } from '../output-schemas';

export const deleteActivityAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-activity',
	outputSchema: deleteRecordActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Activity',
	description: 'Deletes an activity.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one activity by numeric ID. The activity is soft-deleted; Pipedrive purges it after 30 days and it cannot be restored via this piece. To mark an activity complete instead, use Update Activity. Not safe to retry blindly.',
		idempotent: false,
	},
	props: {
		activityId: Property.Number({
			displayName: 'Activity ID',
			description: 'The numeric ID of the activity to delete (from List Activities).',
			required: true,
		}),
	},
	async run(context) {
		const { activityId } = context.propsValue;
		return pipedriveAtomic.call<PipedriveEnvelope<{ id: number }>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v2/activities/${activityId}`,
			resourceLabel: `Activity ${activityId}`,
		});
	},
});
