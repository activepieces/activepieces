import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { getLeadActionOutputSchema } from '../output-schemas';

export const getLeadAction = createAction({
	auth: pipedriveAuth,
	name: 'get-lead',
	outputSchema: getLeadActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Lead',
	description: 'Retrieves a lead by its ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one lead by its UUID, including title, value, owner, linked person/organization and labels. Use when you already hold the lead ID; to locate a lead by text use Find Lead. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			description: 'The lead UUID (from Find Lead or a lead trigger).',
			required: true,
		}),
	},
	async run(context) {
		const leadId = encodeURIComponent(context.propsValue.leadId.trim());
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v1/leads/${leadId}`,
			resourceLabel: `Lead ${context.propsValue.leadId}`,
		});
	},
});
