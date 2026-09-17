import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listCrmNotesActionOutputSchema } from '../output-schemas';

export const listCrmNotes = createAction({
	auth: sendinblueAuth,
	name: 'list_crm_notes',
	outputSchema: listCrmNotesActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List CRM Notes',
	description: 'List the CRM notes in the Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Brevo CRM notes, optionally restricted to notes attached to a company, deal or contact entity and to a date range. Use this to review or audit notes already logged on a CRM record instead of guessing their content. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		entity: Property.StaticDropdown({
			displayName: 'Entity Type',
			description: 'Restrict to notes attached to this entity type.',
			required: false,
			options: {
				options: [
					{ label: 'Companies', value: 'companies' },
					{ label: 'Deals', value: 'deals' },
					{ label: 'Contacts', value: 'contacts' },
				],
			},
		}),
		entity_ids: Property.ShortText({
			displayName: 'Entity IDs',
			description:
				'Comma-separated entity IDs to filter by, e.g. a specific company or contact id.',
			required: false,
		}),
		date_from: Property.Number({
			displayName: 'Date From',
			description: 'Unix timestamp in milliseconds.',
			required: false,
		}),
		date_to: Property.Number({
			displayName: 'Date To',
			description: 'Unix timestamp in milliseconds.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of notes to return per page. Defaults to 50.',
			required: false,
			defaultValue: 50,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Index of the first note to return. Defaults to 0.',
			required: false,
			defaultValue: 0,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order for the results, based on the note creation date.',
			required: false,
			options: {
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
	},
	async run(context) {
		const { entity, entity_ids, date_from, date_to, limit, offset, sort } =
			context.propsValue;

		const response = await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/crm/notes',
			query: {
				entity,
				entityIds: entity_ids,
				dateFrom: date_from,
				dateTo: date_to,
				limit,
				offset,
				sort,
			},
		});

		return response;
	},
});
