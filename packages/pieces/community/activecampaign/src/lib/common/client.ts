import {
	HttpMessageBody,
	HttpMethod,
	QueryParams,
	httpClient,
	HttpRequest,
} from '@activepieces/pieces-common';
import {
	AccountCustomFieldsResponse,
	ContactCustomFieldsResponse,
	ContactList,
	CreateAccountRequest,
	CreateContactRequest,
	CreateWebhookRequest,
	CreateWebhookResponse,
	ListAccountsResponse,
	ListContactsResponse,
	ListTagsResponse,
} from './types';

function emptyValueFilter(accessor: (key: string) => any): (key: string) => boolean {
	return (key: string) => {
		const val = accessor(key);
		return val !== null && val !== undefined && (typeof val != 'string' || val.length > 0);
	};
}

export function prepareQuery(request?: Record<string, any>): QueryParams {
	const params: QueryParams = {};
	if (!request) return params;
	Object.keys(request)
		.filter(emptyValueFilter((k) => request[k]))
		.forEach((k: string) => {
			params[k] = (request as Record<string, any>)[k].toString();
		});
	return params;
}

export class ActiveCampaignClient {
	constructor(private apiUrl: string, private apiKey: string) {}

	async makeRequest<T extends HttpMessageBody>(
		method: HttpMethod,
		resourceUri: string,
		query?: QueryParams,
		body: any | undefined = undefined,
	): Promise<T> {
		const baseUrl = this.apiUrl.replace(/\/$/, '');
		const request: HttpRequest = {
			method: method,
			url: baseUrl + '/api/3' + resourceUri,
			headers: {
				'Api-Token': this.apiKey,
			},
			queryParams: query,
			body: body,
		};
		const res = await httpClient.sendRequest<T>(request);
		return res.body;
	}

	async authenticate() {
		return await this.makeRequest(HttpMethod.GET, '/users/me');
	}

	async subscribeWebhook(request: CreateWebhookRequest): Promise<CreateWebhookResponse> {
		return await this.makeRequest<CreateWebhookResponse>(HttpMethod.POST, '/webhooks', undefined, {
			webhook: request,
		});
	}

	async unsubscribeWebhook(webhookId: string) {
		return await this.makeRequest(HttpMethod.DELETE, `/webhooks/${webhookId}`);
	}

	async listContactLists() {
		return await this.makeRequest<{ lists: ContactList[] }>(
			HttpMethod.GET,
			'/lists',
			prepareQuery({ limit: 20 }),
		);
	}

	async createAccount(request: CreateAccountRequest) {
		return await this.makeRequest(HttpMethod.POST, '/accounts', undefined, { account: request });
	}

	async updateAccount(accountId: number, request: Partial<CreateAccountRequest>) {
		return await this.makeRequest(HttpMethod.PUT, `/accounts/${accountId}`, undefined, {
			account: request,
		});
	}

	async listAccounts(search?: string): Promise<ListAccountsResponse> {
		return await this.makeRequest<ListAccountsResponse>(
			HttpMethod.GET,
			'/accounts',
			prepareQuery({ search: search }),
		);
	}

	async listAccountCustomFields() {
		return await this.makeRequest<{ accountCustomFieldMeta: AccountCustomFieldsResponse[] }>(
			HttpMethod.GET,
			'/accountCustomFieldMeta',
		);
	}

	async createContact(request: CreateContactRequest) {
		return await this.makeRequest(HttpMethod.POST, '/contacts', undefined, { contact: request });
	}

	async updateContact(contactId: number, request: Partial<CreateContactRequest>) {
		return await this.makeRequest(HttpMethod.PUT, `/contacts/${contactId}`, undefined, {
			contact: request,
		});
	}

	async listContacts(): Promise<ListContactsResponse> {
		return await this.makeRequest<ListContactsResponse>(HttpMethod.GET, '/contacts');
	}

	async listContactCustomFields(): Promise<ContactCustomFieldsResponse> {
		return await this.makeRequest<ContactCustomFieldsResponse>(HttpMethod.GET, '/fields');
	}

	async addContactToList(listId: string, contactId: string, status: string) {
		return await this.makeRequest(HttpMethod.POST, '/contactLists', undefined, {
			contactList: { list: listId, contact: contactId, status: status },
		});
	}

	async createAccountContactAssociation(contactId: number, accountId: number, jobTitle?: string) {
		return await this.makeRequest(HttpMethod.POST, '/accountContacts', undefined, {
			accountContact: { contact: contactId, account: accountId, jobTitle: jobTitle },
		});
	}

	async addTagToContact(contactId: string, tagId: string) {
		return await this.makeRequest(HttpMethod.POST, '/contactTags', undefined, {
			contactTag: { contact: contactId, tag: tagId },
		});
	}

	async listTags(): Promise<ListTagsResponse> {
		return await this.makeRequest<ListTagsResponse>(HttpMethod.GET, '/tags');
	}
}
