import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { pipedriveTransformCustomFields } from '../common';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { ORGANIZATION_OPTIONAL_FIELDS } from '../common/constants';
import { getOrganizationActionOutputSchema } from '../output-schemas';

export const getOrganizationAction = createAction({
	auth: pipedriveAuth,
	name: 'get-organization',
	outputSchema: getOrganizationActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Organization',
	description: 'Retrieves an organization by its ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one organization by numeric ID, including people/deal/activity counters and custom fields by their names. Use when you already hold the organization ID; to locate one by name use Search Organizations, and for an exact single-field match use Find Organization. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		organizationId: Property.Number({
			displayName: 'Organization ID',
			description:
				'The numeric organization ID (from Search Organizations, List Organizations or an organization trigger).',
			required: true,
		}),
	},
	async run(context) {
		const { organizationId } = context.propsValue;
		const response = await pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v2/organizations/${organizationId}`,
			resourceLabel: `Organization ${organizationId}`,
			query: { include_fields: ORGANIZATION_OPTIONAL_FIELDS.join(',') },
		});
		const customFields = await pipedriveAtomic.fetchCustomFieldDefinitions({
			auth: context.auth,
			resourceUri: '/v1/organizationFields',
		});
		return {
			success: response.success,
			data: pipedriveTransformCustomFields(customFields, response.data),
		};
	},
});
