import { OutputSchema } from '@activepieces/pieces-framework';

import { noteFields, noteLeadFields } from '../../../output-schemas';

export const mauticCreateNoteOutputSchema: OutputSchema = {
	fields: [{ key: 'note', label: 'Note', children: noteFields }],
};

export const mauticDeleteNoteOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'note',
			label: 'Note',
			children: [
				{ key: 'id', label: 'ID' },
				{ key: 'text', label: 'Text' },
				{ key: 'type', label: 'Type' },
				{ key: 'dateTime', label: 'Date Time', format: 'datetime' },
				{ key: 'lead', label: 'Lead', children: noteLeadFields },
			],
		},
	],
};

export const mauticListNotesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'notes', label: 'Notes', labelKey: 'id', listItems: noteFields },
	],
};
