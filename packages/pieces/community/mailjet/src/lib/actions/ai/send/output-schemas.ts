import { OutputSchema } from '@activepieces/pieces-framework';

export const mailjetSendEmailOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'Messages',
			label: 'Messages',
			labelKey: 'Status',
			listItems: [
				{ key: 'Status', label: 'Status' },
				{ key: 'CustomID', label: 'Custom ID' },
				{
					key: 'To',
					label: 'To',
					listItems: [
						{ key: 'Email', label: 'Email', format: 'email' },
						{ key: 'MessageUUID', label: 'Message UUID' },
						{ key: 'MessageID', label: 'Message ID' },
						{ key: 'MessageHref', label: 'Message Href', format: 'url' },
					],
				},
				{
					key: 'Cc',
					label: 'Cc',
					listItems: [
						{ key: 'Email', label: 'Email', format: 'email' },
						{ key: 'MessageUUID', label: 'Message UUID' },
						{ key: 'MessageID', label: 'Message ID' },
						{ key: 'MessageHref', label: 'Message Href', format: 'url' },
					],
				},
				{
					key: 'Bcc',
					label: 'Bcc',
					listItems: [
						{ key: 'Email', label: 'Email', format: 'email' },
						{ key: 'MessageUUID', label: 'Message UUID' },
						{ key: 'MessageID', label: 'Message ID' },
						{ key: 'MessageHref', label: 'Message Href', format: 'url' },
					],
				},
			],
		},
	],
};
