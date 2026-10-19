import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { deleteRecordWithAdditionalDataActionOutputSchema } from '../output-schemas';

export const deleteLeadAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-lead',
	outputSchema: deleteRecordWithAdditionalDataActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Lead',
	description: 'Deletes a lead.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one lead by its UUID; it cannot be restored via this piece. To turn a lead into a deal instead, use Convert Lead to Deal; to archive it, use Update Lead. Safe to retry: a repeat call on an already deleted record also succeeds.',
		idempotent: true,
	},
	props: {
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			description: 'The UUID of the lead to delete (from Find Lead).',
			required: true,
		}),
	},
	async run(context) {
		const leadId = encodeURIComponent(context.propsValue.leadId.trim());
		return pipedriveAtomic.call<PipedriveEnvelope<{ id: string }>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v1/leads/${leadId}`,
			resourceLabel: `Lead ${context.propsValue.leadId}`,
		});
	},
});
