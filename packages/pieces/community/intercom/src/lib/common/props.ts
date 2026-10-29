import { HttpMethod } from '@activepieces/pieces-common';
import {
	DropdownOption,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import {
	collectCapped,
	intercomRequest,
	IntercomAuthValue,
	isRecord,
	nextPageNumber,
	nextStartingAfter,
} from './client';
import { getTicketTypeAttributes } from './ticket-attributes';

export const conversationIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		auth: intercomAuth,
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}
			return safeDropdown(async () => {
				const result = await collectCapped<IntercomConversationSummary>({
					max: DROPDOWN_CAP,
					fetchPage: async (cursor) => {
						const body = await intercomRequest<{ conversations?: IntercomConversationSummary[] }>({
							auth: auth,
							method: HttpMethod.GET,
							path: ['conversations'],
							query: { per_page: 150, starting_after: cursor },
							operation: 'list conversations',
						});
						return { items: body.conversations ?? [], next: nextStartingAfter(body) };
					},
				});
				return toDropdown({
					truncated: result.truncated,
					options: result.items.map((conversation) => ({
						value: conversation.id,
						label: conversationLabel(conversation),
					})),
				});
			});
		},
	});

export const tagIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		auth: intercomAuth,
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}
			return safeDropdown(async () => {
				const body = await intercomRequest<{ data?: Array<{ id: string; name: string }> }>({
					auth: auth,
					method: HttpMethod.GET,
					path: ['tags'],
					operation: 'list tags',
				});
				return toDropdown({
					truncated: false,
					options: (body.data ?? []).map((tag) => ({ value: tag.id, label: tag.name })),
				});
			});
		},
	});

export const companyIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		auth: intercomAuth,
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}
			return safeDropdown(async () => {
				const result = await collectPaged<{ id: string; name?: string; company_id?: string }>({
					loadPage: (page) =>
						intercomRequest({
							auth: auth,
							method: HttpMethod.POST,
							path: ['companies', 'list'],
							query: { page, per_page: 60, order: 'desc' },
							operation: 'list companies',
						}),
					itemsKey: 'data',
				});
				return toDropdown({
					truncated: result.truncated,
					options: result.items.map((company) => ({
						value: company.id,
						label: company.name || company.company_id || company.id,
					})),
				});
			});
		},
	});

export const contactIdProp = (displayName: string, contactType: string | null, required = true) =>
	Property.Dropdown({
		auth: intercomAuth,
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}
			return safeDropdown(async () => {
				const result = await searchContactsForDropdown({
					auth: auth,
					roles: contactType === null ? ['user', 'lead'] : [contactType],
				});
				return toDropdown({
					truncated: result.truncated,
					options: result.items.map((contact) => ({
						value: contact.id,
						label: `${contact.name ?? ''}, ${contact.email ?? ''}, ${contact.external_id ?? ''}`,
					})),
				});
			});
		},
	});

export async function contactOptionsForRoles({ auth, roles }: { auth: IntercomAuthValue; roles: string[] }) {
	return safeDropdown(async () => {
		const result = await searchContactsForDropdown({ auth, roles });
		return toDropdown({
			truncated: result.truncated,
			options: result.items.map((contact) => ({
				value: contact.id,
				label: `${contact.name ?? ''}, ${contact.email ?? ''}, ${contact.external_id ?? ''}`,
			})),
		});
	});
}

export const collectionIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		auth: intercomAuth,
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}
			return safeDropdown(async () => {
				const result = await collectPaged<{ id: string; name: string }>({
					loadPage: (page) =>
						intercomRequest({
							auth: auth,
							method: HttpMethod.GET,
							path: ['help_center', 'collections'],
							query: { page, per_page: 150 },
							operation: 'list Help Center collections',
						}),
					itemsKey: 'data',
				});
				return toDropdown({
					truncated: result.truncated,
					options: result.items.map((collection) => ({ value: collection.id, label: collection.name })),
				});
			});
		},
	});

export const ticketTypeIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		auth: intercomAuth,
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}
			return safeDropdown(async () => {
				const types = await listTicketTypes({ auth: auth });
				return toDropdown({
					truncated: false,
					options: types.map((type) => ({ value: type.id, label: type.name })),
				});
			});
		},
	});

export const ticketIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		auth: intercomAuth,
		displayName,
		required,
		refreshers: ['ticketTypeId'],
		options: async ({ auth, ticketTypeId }) => {
			if (!auth) {
				return connectFirst();
			}
			if (!ticketTypeId) {
				return { options: [], disabled: true, placeholder: 'Select a ticket type first.' };
			}
			return safeDropdown(async () => {
				const result = await collectCapped<{ id: string; ticket_attributes?: Record<string, unknown> }>({
					max: DROPDOWN_CAP,
					fetchPage: async (cursor) => {
						const body = await intercomRequest<{ tickets?: Array<{ id: string; ticket_attributes?: Record<string, unknown> }> }>({
							auth: auth,
							method: HttpMethod.POST,
							path: ['tickets', 'search'],
							body: {
								query: { field: 'ticket_type_id', operator: '=', value: String(ticketTypeId) },
								pagination: { per_page: 150, ...(cursor ? { starting_after: cursor } : {}) },
							},
							operation: 'search tickets',
						});
						return { items: body.tickets ?? [], next: nextStartingAfter(body) };
					},
				});
				return toDropdown({
					truncated: result.truncated,
					options: result.items.map((ticket) => {
						const title = ticket.ticket_attributes?.['_default_title_'];
						return { value: ticket.id, label: typeof title === 'string' && title.length > 0 ? title : ticket.id };
					}),
				});
			});
		},
	});

export const ticketPropertiesProp = (displayName: string, required = true) =>
	Property.DynamicProperties({
		auth: intercomAuth,
		displayName,
		refreshers: ['ticketTypeId'],
		required,
		props: async ({ auth, ticketTypeId }) => {
			if (!auth) return {};
			if (!ticketTypeId) return {};

			const attributes = await getTicketTypeAttributes({
				auth: auth,
				ticketTypeId: String(ticketTypeId),
			});

			const props: DynamicPropsValue = {};
			for (const field of attributes) {
				switch (field.data_type) {
					case 'string':
						props[field.name] = Property.LongText({
							displayName:
								field.name === '_default_title_'
									? 'Title (Default)'
									: field.name === '_default_description_'
									? 'Description (Default)'
									: field.name,
							required: false,
						});
						break;
					case 'integer':
					case 'decimal':
						props[field.name] = Property.Number({
							displayName: field.name,
							required: false,
						});
						break;
					case 'boolean':
						props[field.name] = Property.Checkbox({
							displayName: field.name,
							required: false,
						});
						break;
					case 'datetime':
						props[field.name] = Property.DateTime({
							displayName: field.name,
							required: false,
						});
						break;
					case 'list':
						{
							const options = field.input_options?.['list_options'];
							props[field.name] = Property.StaticDropdown({
								displayName: field.name,
								required: false,
								options: {
									disabled: false,
									options: Array.isArray(options)
										? options.map((option: { id: string; label: string }) => ({
												value: option.id,
												label: option.label,
										  }))
										: [],
								},
							});
						}
						break;
					default:
						break;
				}
			}

			return props;
		},
	});

export const adminDropdown = <R extends boolean>(options: { displayName: string; required: R }) =>
	Property.Dropdown<string, R, typeof intercomAuth>({
		auth: intercomAuth,
		displayName: options.displayName,
		required: options.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}
			return safeDropdown(async () => {
				const body = await intercomRequest<{ admins?: Array<{ id: string; name?: string; email?: string }> }>({
					auth: auth,
					method: HttpMethod.GET,
					path: ['admins'],
					operation: 'list admins',
				});
				return toDropdown({
					truncated: false,
					options: (body.admins ?? []).map((admin) => ({
						value: admin.id,
						label: admin.name || admin.email || admin.id,
					})),
				});
			});
		},
	});

export const contactDropdown = <R extends boolean>(options: { displayName: string; required: R }) =>
	Property.Dropdown<string, R, typeof intercomAuth>({
		auth: intercomAuth,
		displayName: options.displayName,
		required: options.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return connectFirst();
			}
			return safeDropdown(async () => {
				const result = await searchContactsForDropdown({
					auth: auth,
					roles: ['user', 'lead'],
				});
				return toDropdown({
					truncated: result.truncated,
					options: result.items.map((contact) => ({
						value: contact.id,
						label: contact.name || contact.email || contact.id,
					})),
				});
			});
		},
	});

export async function listTicketTypes({ auth }: { auth: IntercomAuthValue }): Promise<IntercomTicketTypeSummary[]> {
	const body = await intercomRequest<{
		data?: IntercomTicketTypeSummary[];
		ticket_types?: IntercomTicketTypeSummary[];
	}>({
		auth,
		method: HttpMethod.GET,
		path: ['ticket_types'],
		operation: 'list ticket types',
	});
	return body.data ?? body.ticket_types ?? [];
}

async function searchContactsForDropdown({
	auth,
	roles,
}: {
	auth: IntercomAuthValue;
	roles: string[];
}): Promise<{ items: IntercomContactSummary[]; truncated: boolean }> {
	return collectCapped<IntercomContactSummary>({
		max: DROPDOWN_CAP,
		fetchPage: async (cursor) => {
			const body = await intercomRequest<{ data?: IntercomContactSummary[] }>({
				auth,
				method: HttpMethod.POST,
				path: ['contacts', 'search'],
				body: {
					query:
						roles.length === 1
							? { field: 'role', operator: '=', value: roles[0] }
							: { field: 'role', operator: 'IN', value: roles },
					pagination: { per_page: 150, ...(cursor ? { starting_after: cursor } : {}) },
					sort: { field: 'updated_at', order: 'descending' },
				},
				operation: 'search contacts',
			});
			return { items: body.data ?? [], next: nextStartingAfter(body) };
		},
	});
}

async function collectPaged<T>({
	loadPage,
	itemsKey,
}: {
	loadPage: (page: number) => Promise<unknown>;
	itemsKey: string;
}): Promise<{ items: T[]; truncated: boolean }> {
	let pagesFetched = 0;
	const result = await collectCapped<T>({
		max: DROPDOWN_CAP,
		fetchPage: async (cursor) => {
			const page = cursor === undefined ? 1 : Number(cursor);
			const body = await loadPage(page);
			pagesFetched += 1;
			const items = readItems<T>({ body, itemsKey });
			const nextPage = nextPageNumber(body);
			if (nextPage === undefined || pagesFetched >= MAX_DROPDOWN_PAGES) {
				return { items, next: undefined };
			}
			return { items, next: String(nextPage) };
		},
	});
	return { items: result.items, truncated: result.truncated || pagesFetched >= MAX_DROPDOWN_PAGES };
}

function readItems<T>({ body, itemsKey }: { body: unknown; itemsKey: string }): T[] {
	if (!isRecord(body)) {
		return [];
	}
	const items = body[itemsKey];
	return Array.isArray(items) ? items : [];
}

function conversationLabel(conversation: IntercomConversationSummary): string {
	const author = conversation.source?.author;
	const who = author?.email || author?.name || 'Unknown sender';
	return `${who}${conversation.title ? `, ${conversation.title}` : ''}, ${conversation.id}`;
}

function connectFirst() {
	return {
		options: [],
		disabled: true,
		placeholder: 'Please connect your account first.',
	};
}

async function safeDropdown(
	load: () => Promise<{ options: DropdownOption<string>[]; disabled: boolean; placeholder?: string }>,
) {
	try {
		return await load();
	} catch (error) {
		return {
			options: [],
			disabled: true,
			placeholder: `Could not load options: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

function toDropdown({ options, truncated }: { options: DropdownOption<string>[]; truncated: boolean }) {
	return {
		disabled: false,
		options,
		placeholder: truncated
			? `Showing the first ${DROPDOWN_CAP.toLocaleString('en-US')} items. To use another one, switch this field to a custom value and paste its ID.`
			: undefined,
	};
}

const DROPDOWN_CAP = 1000;
const MAX_DROPDOWN_PAGES = 20;

type IntercomConversationSummary = {
	id: string;
	title?: string | null;
	source?: { author?: { email?: string | null; name?: string | null } | null } | null;
};

type IntercomContactSummary = {
	id: string;
	name?: string | null;
	email?: string | null;
	external_id?: string | null;
};

export type IntercomTicketTypeSummary = {
	id: string;
	name: string;
	description?: string;
	category?: string;
	archived?: boolean;
	ticket_type_attributes?: { data?: unknown[] };
};
