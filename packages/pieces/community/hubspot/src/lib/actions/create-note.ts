import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createNoteOutputSchema } from '../output-schemas';
import { ASSOCIATION_TYPE_IDS, HUBSPOT_DEFINED } from '../common/constants';

export const createNoteAction = createAction({
	auth: hubspotAuth,
	name: 'create_note',
	classification: 'WRITE',
	displayName: 'Create Note',
	description: 'Logs a note on the timeline of a CRM record.',
	audience: 'ai',
	outputSchema: createNoteOutputSchema,
	aiMetadata: {
		description:
			'Logs a note on the timeline of a contact, company, deal or ticket. Use it to record what happened, such as the summary of a call or an email thread, against the record it concerns. The note body accepts HTML, and the record it attaches to is given by its id and object type. When no timestamp is supplied the note is dated now; supply an ISO 8601 timestamp to backdate it. Each call creates another note, so it is not idempotent.',
		idempotent: false,
	},
	props: {
		noteBody: Property.LongText({
			displayName: 'Note Body',
			description: 'The note text. Basic HTML such as <b> and <br> is preserved.',
			required: true,
		}),
		associatedObjectType: Property.StaticDropdown({
			displayName: 'Attach To Object Type',
			description: 'The kind of record the note belongs to.',
			required: true,
			defaultValue: 'contact',
			options: {
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Company', value: 'company' },
					{ label: 'Deal', value: 'deal' },
					{ label: 'Ticket', value: 'ticket' },
				],
			},
		}),
		associatedObjectId: Property.ShortText({
			displayName: 'Attach To Object ID',
			description: 'The id of the record, as returned by the matching Find or Get action.',
			required: true,
		}),
		timestamp: Property.ShortText({
			displayName: 'Timestamp',
			description: 'ISO 8601 timestamp for the note, such as 2026-09-14T12:00:00Z. Defaults to now.',
			required: false,
		}),
	},
	async run(context) {
		const { noteBody, associatedObjectType, associatedObjectId, timestamp } = context.propsValue;

		const associationTypeId = ASSOCIATION_TYPE_IDS['NOTE_TO'][associatedObjectType];

		const response = await httpClient.sendRequest<Record<string, unknown>>({
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/crm/v3/objects/notes',
			body: {
				properties: {
					hs_timestamp: timestamp ?? new Date().toISOString(),
					hs_note_body: noteBody,
				},
				associations: [
					{
						to: { id: associatedObjectId },
						types: [
							{
								associationCategory: HUBSPOT_DEFINED,
								associationTypeId,
							},
						],
					},
				],
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		return response.body;
	},
});
