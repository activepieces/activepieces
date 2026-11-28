import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput } from '../../common/ai-props';
import { rawNoteOutputSchema } from '../../common/output-schemas';

export const createNoteAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_note_human',
	classification: 'WRITE',
	displayName: 'Add Note',
	description: 'Adds a note to a contact, deal or account.',
	audience: 'human',
	aiMetadata: {
		description: 'Adds a note to a contact, deal or account. Each call adds another note.',
		idempotent: false,
	},
	outputSchema: rawNoteOutputSchema,
	props: {
		recordType: Property.StaticDropdown<string>({
			displayName: 'Add To',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Contact', value: 'Subscriber' },
					{ label: 'Deal', value: 'Deal' },
					{ label: 'Account', value: 'CustomerAccount' },
				],
			},
		}),
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'The ID of the contact, deal or account. Map it from the trigger or an earlier step, for example the contact ID from Find Contact.',
			required: true,
		}),
		note: Property.LongText({ displayName: 'Note', required: true }),
	},
	async run({ auth, propsValue }) {
		const note = {
			note: propsValue.note,
			reltype: propsValue.recordType,
			relid: aiInput.numericId({ value: propsValue.recordId, label: 'Record ID' }),
		};
		return (await makeClient(auth.props).request({ method: 'POST', path: '/notes', body: { note } })).body;
	},
});
