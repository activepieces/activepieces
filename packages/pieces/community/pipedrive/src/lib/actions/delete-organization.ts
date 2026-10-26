import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { deleteRecordActionOutputSchema } from '../output-schemas';

export const deleteOrganizationAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-organization',
	outputSchema: deleteRecordActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Organization',
	description: 'Deletes an organization.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one organization by numeric ID. The organization is soft-deleted; Pipedrive purges it after 30 days and it cannot be restored via this piece. Not safe to retry blindly.',
		idempotent: false,
	},
	props: {
		organizationId: Property.Number({
			displayName: 'Organization ID',
			description:
				'The numeric ID of the organization to delete (from Search Organizations or List Organizations).',
			required: true,
		}),
	},
	async run(context) {
		const { organizationId } = context.propsValue;
		return pipedriveAtomic.call<PipedriveEnvelope<{ id: number }>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v2/organizations/${organizationId}`,
			resourceLabel: `Organization ${organizationId}`,
		});
	},
});
