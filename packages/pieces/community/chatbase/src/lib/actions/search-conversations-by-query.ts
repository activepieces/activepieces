import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../auth';
import { chatbaseCommon } from '../common';
import { chatbotIdDropdown } from '../common/props';

export const searchConversationsAction = createAction({
	auth: chatbaseAuth,
	name: 'search_conversations',
	classification: 'SEARCH',
	displayName: 'Find Conversations',
	description: "Gets a chatbot's conversations, filtered by source and date.",
	audience: 'both',
	aiMetadata: { description: 'Retrieves logged conversations for a specific Chatbase chatbot (selected by its ID), with optional filters for source channels (API, WhatsApp, Slack, etc.), a start/end date range, and pagination. Use when an agent needs to review or audit past chatbot conversations; leaving the optional filters empty returns all conversations for the chatbot. Idempotent read-only lookup.', idempotent: true },
	propertyGroups: [
		{
			key: 'conversations',
			display: 'section',
			label: 'Conversations',
			icon: 'inbox',
			props: ['chatbotId', 'filteredSources'],
		},
		{
			key: 'dates',
			display: 'section',
			label: 'Date Range',
			icon: 'calendar',
			props: ['dateNote', 'startDate', 'endDate'],
		},
		{
			key: 'pages',
			display: 'section',
			label: 'Pagination',
			icon: 'sliders',
			props: ['page', 'size'],
		},
	],
	props: {
		chatbotId: chatbotIdDropdown,
		filteredSources: Property.StaticMultiSelectDropdown({
			displayName: 'Sources',
			description: 'Empty returns conversations from every source.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Action preview', value: 'Action preview' },
					{ label: 'API', value: 'API' },
					{ label: 'Chatbase site', value: 'Chatbase site' },
					{ label: 'Instagram', value: 'Instagram' },
					{ label: 'Messenger', value: 'Messenger' },
					{ label: 'Playground', value: 'Playground' },
					{ label: 'Slack', value: 'Slack' },
					{ label: 'Unspecified', value: 'Unspecified' },
					{ label: 'WhatsApp', value: 'WhatsApp' },
					{ label: 'Widget or Iframe', value: 'Widget or Iframe' },
				],
			},
		}),
		dateNote: Property.MarkDown({
			value: 'Only the date is used; the time of day is ignored.',
			variant: MarkdownVariant.INFO,
		}),
		startDate: Property.DateTime({
			displayName: 'Start Date',
			placeholder: '2026-01-01',
			required: false,
			width: 'half',
		}),
		endDate: Property.DateTime({
			displayName: 'End Date',
			placeholder: '2026-01-31',
			required: false,
			width: 'half',
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page to return, starting at 1.',
			required: false,
			width: 'half',
		}),
		size: Property.Number({
			displayName: 'Page Size',
			description: "Conversations per page. Empty: Chatbase's default.",
			required: false,
			width: 'half',
		}),
	},

	async run(context) {
		const { chatbotId, filteredSources, startDate, endDate, page, size } = context.propsValue;

		const apiKey = context.auth.secret_text;

		const queryParams = new URLSearchParams({ chatbotId });

		if (filteredSources?.length) {
			queryParams.append('filteredSources', filteredSources.join(','));
		}
		if (startDate) {
			queryParams.append('startDate', startDate.toString().split('T')[0]);
		}
		if (endDate) {
			queryParams.append('endDate', endDate.toString().split('T')[0]);
		}
		if (page) {
			queryParams.append('page', page.toString());
		}
		if (size) {
			queryParams.append('size', size.toString());
		}

		const response = await chatbaseCommon.makeRequest<unknown>({
			apiKey,
			method: HttpMethod.GET,
			path: `/get-conversations?${queryParams.toString()}`,
		});

		return response;
	},
});
