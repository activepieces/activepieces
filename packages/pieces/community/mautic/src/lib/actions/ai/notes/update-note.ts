import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateNoteOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateNoteAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_note',
	outputSchema: mauticCreateNoteOutputSchema,
	displayName: 'Update Note',
	description: 'Updates fields of a Mautic note.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing note. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Note Id',
			description: 'Numeric note id, from List Notes or Create Note.',
		}),
		lead: Property.ShortText({
			displayName: 'Contact Id',
			description: 'Numeric id of the contact the note belongs to, from List Contacts.',
			required: false,
		}),
		text: Property.LongText({ displayName: 'Text', required: false }),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Defaults to General.',
			required: false,
			options: {
				options: [
					{ label: 'General', value: 'general' },
					{ label: 'Email', value: 'email' },
					{ label: 'Call', value: 'call' },
					{ label: 'Meeting', value: 'meeting' },
				],
			},
		}),
		dateTime: Property.ShortText({
			displayName: 'Date',
			description: 'When the note happened, e.g. "2026-05-01 09:00:00".',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description: 'Other note properties. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { id, additionalFields, lead, text, type, dateTime } = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'notes',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('lead', lead),
				...spreadIfDefined('text', text),
				...spreadIfDefined('type', type),
				...spreadIfDefined('dateTime', dateTime),
			},
		});
	},
});
