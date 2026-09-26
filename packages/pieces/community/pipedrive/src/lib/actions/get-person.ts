import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { pipedriveTransformCustomFields } from '../common';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { PERSON_OPTIONAL_FIELDS } from '../common/constants';
import { getPersonActionOutputSchema } from '../output-schemas';

export const getPersonAction = createAction({
	auth: pipedriveAuth,
	name: 'get-person',
	outputSchema: getPersonActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Person',
	description: 'Retrieves a person by their ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one person (contact) by numeric ID, including emails, phones, deal/activity counters and custom fields by their names. Use when you already hold the person ID; to locate a person by name, email or phone use Search Persons, and for an exact single-field match use Find Person. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		personId: Property.Number({
			displayName: 'Person ID',
			description: 'The numeric person ID (from Search Persons, List Persons or a person trigger).',
			required: true,
		}),
	},
	async run(context) {
		const { personId } = context.propsValue;
		const response = await pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v2/persons/${personId}`,
			resourceLabel: `Person ${personId}`,
			query: { include_fields: PERSON_OPTIONAL_FIELDS.join(',') },
		});
		const customFields = await pipedriveAtomic.fetchCustomFieldDefinitions({
			auth: context.auth,
			resourceUri: '/v1/personFields',
		});
		return {
			success: response.success,
			data: pipedriveTransformCustomFields(customFields, response.data),
		};
	},
});
