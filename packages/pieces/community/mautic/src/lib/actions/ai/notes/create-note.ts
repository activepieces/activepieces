import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateNoteOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateNoteAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_note',
	outputSchema: mauticCreateNoteOutputSchema,
	displayName: 'Create Note',
	description: 'Creates a Mautic note.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a note to a contact. Contact Id and Text are required. Each call adds another note.',
		idempotent: false,
	},
	props: {
		lead: Property.ShortText({
			displayName: 'Contact Id',
			description: 'Numeric id of the contact the note belongs to, from List Contacts.',
			required: true,
		}),
		text: Property.LongText({ displayName: 'Text', required: true }),
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
		const { additionalFields, lead, text, type, dateTime } = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'notes',
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
