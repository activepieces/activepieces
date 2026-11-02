import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { mergeOrganizationsActionOutputSchema } from '../output-schemas';

export const mergeOrganizationsAction = createAction({
	auth: pipedriveAuth,
	name: 'merge-organizations',
	outputSchema: mergeOrganizationsActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Merge Organizations',
	description: 'Merges one organization into another, removing the first.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Merges one organization into another: the organization given as Organization ID To Merge Away is REMOVED, and its people, deals and activities move to the organization given as Surviving Organization ID, which is the only one that still exists afterwards. Irreversible - confirm both IDs with Get Organization first. Not safe to retry.',
		idempotent: false,
	},
	props: {
		organizationId: Property.Number({
			displayName: 'Organization ID To Merge Away (this organization is removed)',
			description:
				'The numeric ID of the organization that will be CONSUMED and no longer exist after the merge.',
			required: true,
		}),
		mergeWithId: Property.Number({
			displayName: 'Surviving Organization ID (this organization is kept)',
			description:
				'The numeric ID of the organization that SURVIVES the merge and will NOT be overwritten.',
			required: true,
		}),
	},
	async run(context) {
		const { organizationId, mergeWithId } = context.propsValue;
		if (organizationId === mergeWithId) {
			throw new Error('An organization cannot be merged with itself.');
		}
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/v1/organizations/${organizationId}/merge`,
			resourceLabel: `Organization ${organizationId}`,
			body: { merge_with_id: mergeWithId },
		});
	},
});
