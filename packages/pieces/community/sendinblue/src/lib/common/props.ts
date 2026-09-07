import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '.';

const PAGE_SIZE = 50;

async function fetchAllLists(apiKey: string): Promise<BrevoList[]> {
	const lists: BrevoList[] = [];
	let offset = 0;
	let hasMore = true;

	while (hasMore) {
		const response = await brevoCommon.apiCall<BrevoListsResponse>({
			apiKey,
			method: HttpMethod.GET,
			resourceUri: '/contacts/lists',
			query: { limit: PAGE_SIZE, offset },
		});

		const page = response.lists ?? [];
		lists.push(...page);
		offset += PAGE_SIZE;
		hasMore = page.length === PAGE_SIZE;
	}

	return lists;
}

async function fetchAllTemplates(apiKey: string): Promise<BrevoTemplate[]> {
	const templates: BrevoTemplate[] = [];
	let offset = 0;
	let hasMore = true;

	while (hasMore) {
		const response = await brevoCommon.apiCall<BrevoTemplatesResponse>({
			apiKey,
			method: HttpMethod.GET,
			resourceUri: '/smtp/templates',
			query: { limit: PAGE_SIZE, offset },
		});

		const page = response.templates ?? [];
		templates.push(...page);
		offset += PAGE_SIZE;
		hasMore = page.length === PAGE_SIZE;
	}

	return templates;
}

function connectFirst() {
	return {
		disabled: true,
		placeholder: 'Connect your Brevo account first.',
		options: [],
	};
}

export const brevoProps = {
	listIds: ({ displayName, description }: ListIdsPropParams) =>
		Property.MultiSelectDropdown({
			displayName,
			description,
			required: false,
			auth: sendinblueAuth,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return connectFirst();
				}

				const lists = await fetchAllLists(auth.secret_text);

				return {
					disabled: false,
					options: lists.map((list) => ({
						label: list.name,
						value: String(list.id),
					})),
				};
			},
		}),
	senderEmail: Property.Dropdown({
		displayName: 'Sender',
		description: 'The verified sender the email is sent from.',
		required: false,
		auth: sendinblueAuth,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}

			const response = await brevoCommon.apiCall<BrevoSendersResponse>({
				apiKey: auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: '/senders',
			});

			return {
				disabled: false,
				options: (response.senders ?? []).map((sender) => ({
					label: sender.name ? `${sender.name} <${sender.email}>` : sender.email,
					value: sender.email,
				})),
			};
		},
	}),
	emailTemplateId: Property.Dropdown({
		displayName: 'Template',
		description:
			'Send a saved Brevo template instead of supplying subject and content.',
		required: false,
		auth: sendinblueAuth,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}

			const templates = await fetchAllTemplates(auth.secret_text);

			return {
				disabled: false,
				options: templates.map((template) => ({
					label: template.name,
					value: template.id,
				})),
			};
		},
	}),
};

export type BrevoList = {
	id: number;
	name: string;
};

export type BrevoListsResponse = {
	lists: BrevoList[];
	count: number;
};

export type BrevoTemplate = {
	id: number;
	name: string;
};

export type BrevoTemplatesResponse = {
	templates: BrevoTemplate[];
	count: number;
};

export type BrevoSender = {
	id: number;
	name?: string;
	email: string;
};

export type BrevoSendersResponse = {
	senders: BrevoSender[];
};

export type ListIdsPropParams = {
	displayName: string;
	description: string;
};
