import { OutputSchema } from '@activepieces/pieces-framework';

export const askAiActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'answer',
			label: 'Answer',
			value: '',
			listItems: [
				{
					key: 'Content',
					label: 'Content',
				},
			],
		},
	],
};

export const transcribeAudioActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'text',
			label: 'Transcribed Text',
		},
		{
			key: 'id',
			label: 'Request ID',
			value: 'x_groq.id',
		},
	],
};

export const translateAudioActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'text',
			label: 'Translated Text',
			value: 'text',
		},
	],
};
