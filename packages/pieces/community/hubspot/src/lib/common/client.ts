import {
	AuthenticationType,
	HttpMethod,
	HttpRequest,
	httpClient,
} from '@activepieces/pieces-common';
import {
	Contact,
	HubSpotAddContactsToListRequest,
	HubSpotAddContactsToListResponse,
	HubSpotContactsCreateOrUpdateResponse,
	HubSpotListsResponse,
	HubSpotRequest,
} from './models';

const API = 'https://api.hubapi.com';

export const hubSpotClient = {
	contacts: {
		async createOrUpdate({
			token,
			email,
			contact,
		}: ContactsCreateOrUpdateParams): Promise<HubSpotContactsCreateOrUpdateResponse> {
			const properties = Object.entries(contact).map(([property, value]) => ({
				property,
				value,
			}));

			const request: HttpRequest<HubSpotRequest> = {
				method: HttpMethod.POST,
				url: `${API}/contacts/v1/contact/createOrUpdate/email/${email}`,
				body: {
					properties,
				},
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token,
				},
			};

			const response = await httpClient.sendRequest<HubSpotContactsCreateOrUpdateResponse>(request);
			return response.body;
		},
	},

	lists: {
		async getStaticLists({ token }: GetStaticListsParams): Promise<HubSpotListsResponse> {
			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: `${API}/contacts/v1/lists/static`,
				queryParams: {
					count: '250',
					offset: '0',
				},
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token,
				},
			};

			const response = await httpClient.sendRequest<HubSpotListsResponse>(request);
			return response.body;
		},

		async addContact({
			token,
			listId,
			email,
		}: ListsAddContactParams): Promise<HubSpotAddContactsToListResponse> {
			const request: HttpRequest<HubSpotAddContactsToListRequest> = {
				method: HttpMethod.POST,
				url: `${API}/contacts/v1/lists/${listId}/add`,
				body: {
					emails: [email],
				},
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token,
				},
			};

			const response = await httpClient.sendRequest<HubSpotAddContactsToListResponse>(request);
			return response.body;
		},
	},

	tasks: {
		async getTasksAfterLastSearch(accessToken: string, lastFetchEpochMS: number) {
			const request: HttpRequest = {
				method: HttpMethod.POST,
				url: `${API}/crm/v3/objects/tasks/search`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: accessToken,
				},
				headers: {
					'Content-Type': 'application/json',
				},
				body: {
					filters: [
						{
							propertyName: 'hs_createdate',
							operator: 'GT',
							value: lastFetchEpochMS,
						},
					],
					properties: [
						'hs_task_body',
						'hubspot_owner_id',
						'hs_task_subject',
						'hs_task_status',
						'hs_task_priority',
						'hs_task_type',
						'hs_created_by',
						'hs_created_by_user_id',
						'hs_modified_by',
						'hs_num_associated_companies',
						'hs_num_associated_contacts',
						'hs_num_associated_deals',
						'hs_num_associated_tickets',
						'hs_product_name',
						'hs_read_only',
						'hs_repeat_status',
						'hs_task_completion_count',
						'hs_task_completion_date',
						'hs_task_is_all_day',
						'hs_task_is_completed',
						'hs_task_is_completed_call',
						'hs_task_is_completed_email',
						'hs_task_is_completed_linked_in',
						'hs_task_is_completed_sequence',
						'hs_task_repeat_interval',
						'hs_updated_by_user_id',
						'hs_timestamp',
					],
					limit: 100,
				},
			};

			const response = await httpClient.sendRequest(request);
			return response.body;
		},
	},

	async searchCompanies(
		accessToken: string,
		filters?: {
			createdAt?: number;
			createdAtOperator?: string;
		},
	) {
		const searchParams = [];

		if (filters && filters.createdAt) {
			searchParams.push({
				propertyName: 'createdate',
				operator: filters.createdAtOperator ?? 'GT',
				value: filters.createdAt,
			});
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${API}/crm/v3/objects/companies/search`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				filters: searchParams,
			},
		});

		return response.body;
	},

	async searchContacts(
		accessToken: string,
		wantedFields: string[],
		filters?: {
			createdAt?: number;
			createdAtOperator?: string;
		},
	) {
		const searchParams = [];

		if (filters && filters.createdAt) {
			searchParams.push({
				propertyName: 'createdate',
				operator: filters.createdAtOperator ?? 'GT',
				value: filters.createdAt,
			});
		}
		const requestBody: Record<string, any> = {
			filters: searchParams,
			properties: wantedFields,
		};

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${API}/crm/v3/objects/contacts/search`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			headers: {
				'Content-Type': 'application/json',
			},
			body: requestBody,
		});

		return response.body;
	},

	async searchDeals(
		accessToken: string,
		filters?: {
			createdAt?: number;
			createdAtOperator?: string;
		},
	) {
		const searchParams = [];

		if (filters && filters.createdAt) {
			searchParams.push({
				propertyName: 'createdate',
				operator: filters.createdAtOperator ?? 'GT',
				value: filters.createdAt,
			});
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${API}/crm/v3/objects/deals/search`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				filters: searchParams,
			},
		});

		return response.body;
	},

	async searchTickets(
		accessToken: string,
		filters?: {
			createdAt?: number;
			createdAtOperator?: string;
		},
	) {
		const searchParams = [];

		if (filters && filters.createdAt) {
			searchParams.push({
				propertyName: 'createdate',
				operator: filters.createdAtOperator ?? 'GT',
				value: filters.createdAt,
			});
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${API}/crm/v3/objects/tickets/search`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				filters: searchParams,
			},
		});

		return response.body;
	},
	async listContactOwners(accessToken: string, email?: string) {
		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `${API}/crm/v3/owners`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			headers: {
				'Content-Type': 'application/json',
			},
			queryParams: {
				email: email!,
			},
		});
		return response.body;
	},
};

type ContactsCreateOrUpdateParams = {
	token: string;
	email: string;
	contact: Partial<Contact>;
};

type GetStaticListsParams = {
	token: string;
};

type ListsAddContactParams = {
	token: string;
	listId: number;
	email: string;
};
