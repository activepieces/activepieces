import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { convertLeadToDealActionOutputSchema } from '../output-schemas';

export const convertLeadToDealAction = createAction({
	auth: pipedriveAuth,
	name: 'convert-lead-to-deal',
	outputSchema: convertLeadToDealActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Convert Lead to Deal',
	description: 'Starts converting a lead into a deal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Starts an asynchronous conversion of a lead into a deal and returns a conversion_id, not the deal. The new deal_id comes from Get Lead Conversion Status (call it with the lead ID and conversion_id until status is completed). On success Pipedrive deletes the lead. Set Stage ID or Pipeline ID, not both (Pipedrive ignores the pipeline when a stage is given); leave both empty to let Pipedrive pick the placement. Not safe to retry: poll the status instead of calling this again.',
		idempotent: false,
	},
	props: {
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			description: 'The UUID of the lead to convert (from Find Lead).',
			required: true,
		}),
		stageId: Property.Number({
			displayName: 'Stage ID',
			description:
				'Stage for the new deal (from List Stages); its pipeline is used. Set this or Pipeline ID, not both.',
			required: false,
		}),
		pipelineId: Property.Number({
			displayName: 'Pipeline ID',
			description:
				'Pipeline for the new deal (from List Pipelines). Set this or Stage ID, not both.',
			required: false,
		}),
	},
	async run(context) {
		const { stageId, pipelineId } = context.propsValue;
		if (!isNil(stageId) && !isNil(pipelineId)) {
			throw new Error(
				'Set either Stage ID or Pipeline ID, not both: Pipedrive ignores Pipeline ID when Stage ID is given.',
			);
		}
		const leadId = context.propsValue.leadId.trim();
		const response = await pipedriveAtomic.call<PipedriveEnvelope<{ conversion_id: string }>>({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/v2/leads/${encodeURIComponent(leadId)}/convert/deal`,
			resourceLabel: `Lead ${leadId}`,
			body: {
				stage_id: stageId,
				pipeline_id: pipelineId,
			},
		});
		return {
			conversion_id: response.data.conversion_id,
			lead_id: leadId,
		};
	},
});
