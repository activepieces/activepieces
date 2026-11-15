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
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{ label: 'Contact', value: 'Subscriber', description: 'A person' },
					{ label: 'Deal', value: 'Deal', description: 'A sales opportunity' },
					{ label: 'Account', value: 'CustomerAccount', description: 'A company' },
				],
			},
		}),
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'The contact, deal or account ID, from a trigger or an earlier step.',
			placeholder: '42',
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
