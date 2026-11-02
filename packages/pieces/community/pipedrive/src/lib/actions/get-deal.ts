import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { pipedriveTransformCustomFields } from '../common';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { DEAL_OPTIONAL_FIELDS } from '../common/constants';
import { getDealActionOutputSchema } from '../output-schemas';

export const getDealAction = createAction({
	auth: pipedriveAuth,
	name: 'get-deal',
	outputSchema: getDealActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Deal',
	description: 'Retrieves a deal by its ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one deal by its numeric ID, including activity/product counters and custom fields by their names. Use when you already hold the deal ID; to locate a deal by text use Search Deals, and for an exact single-field match use Find Deal. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		dealId: Property.Number({
			displayName: 'Deal ID',
			description: 'The numeric deal ID (from Search Deals, List Deals or a deal trigger).',
			required: true,
		}),
	},
	async run(context) {
		const { dealId } = context.propsValue;
		const response = await pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v2/deals/${dealId}`,
			resourceLabel: `Deal ${dealId}`,
			query: { include_fields: DEAL_OPTIONAL_FIELDS.join(',') },
		});
		const customFields = await pipedriveAtomic.fetchCustomFieldDefinitions({
			auth: context.auth,
			resourceUri: '/v1/dealFields',
		});
		return {
			success: response.success,
			data: pipedriveTransformCustomFields(customFields, response.data),
		};
	},
});
