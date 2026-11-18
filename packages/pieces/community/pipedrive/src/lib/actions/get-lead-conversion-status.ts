import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { getLeadConversionStatusActionOutputSchema } from '../output-schemas';

export const getLeadConversionStatusAction = createAction({
	auth: pipedriveAuth,
	name: 'get-lead-conversion-status',
	outputSchema: getLeadConversionStatusActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Lead Conversion Status',
	description: 'Checks the status of a lead-to-deal conversion.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads the current status of a conversion started by Convert Lead to Deal: not_started, running, completed, failed or rejected. When completed, deal_id holds the new deal (read it with Get Deal). Makes one check per call; call again after a short wait while running. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			description: 'The UUID of the lead that is being converted.',
			required: true,
		}),
		conversionId: Property.ShortText({
			displayName: 'Conversion ID',
			description: 'The conversion_id returned by Convert Lead to Deal.',
			required: true,
		}),
	},
	async run(context) {
		const leadId = encodeURIComponent(context.propsValue.leadId.trim());
		const conversionId = encodeURIComponent(context.propsValue.conversionId.trim());
		return pipedriveAtomic.call<
			PipedriveEnvelope<{
				conversion_id: string;
				status: string;
				deal_id?: number;
				lead_id?: string;
			}>
		>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v2/leads/${leadId}/convert/status/${conversionId}`,
			resourceLabel: `Conversion ${context.propsValue.conversionId} of lead ${context.propsValue.leadId}`,
		});
	},
});
