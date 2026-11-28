import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput } from '../../common/ai-props';
import { NOTE_RELTYPES } from '../../common/constants';
import { noteAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const createNoteAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_note',
	classification: 'WRITE',
	displayName: 'Create Note',
	description: 'Adds a note to a contact, deal or account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds a text note to a contact (record ID or email), a deal or an account. ActiveCampaign escapes HTML and strips emoji. Each call adds another note, so do not repeat it.',
		idempotent: false,
	},
	outputSchema: noteAiOutputSchema,
	props: {
		record_type: Property.StaticDropdown<string>({
			displayName: 'Record Type',
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
		record_id: Property.ShortText({
			displayName: 'Record ID',
			description: 'The contact ID or email, deal ID (List Deals) or account ID (List Accounts).',
			required: true,
		}),
		note: Property.LongText({ displayName: 'Note', required: true }),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const reltype = aiInput.requireText({ value: propsValue.record_type, label: 'Record Type' });
		if (!NOTE_RELTYPES.includes(reltype)) {
			throw new Error('Record Type must be Subscriber (contact), Deal or CustomerAccount (account).');
		}
		const relid =
			reltype === 'Subscriber'
				? await aiInput.resolveContactId({ client, value: propsValue.record_id, label: 'Record ID' })
				: aiInput.numericId({ value: propsValue.record_id, label: 'Record ID' });
		const note = { note: aiInput.requireText({ value: propsValue.note, label: 'Note' }), reltype, relid };
		const response = await client.request({ method: 'POST', path: '/notes', body: { note } });
		return aiOutput.idText({ record: acData.recordAt({ value: response.body, key: 'note' }), keys: ['id', 'note', 'reltype', 'relid', 'cdate'] });
	},
});
