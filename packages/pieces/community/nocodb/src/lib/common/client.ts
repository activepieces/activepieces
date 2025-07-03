import {
	HttpMessageBody,
	HttpMethod,
	QueryParams,
	httpClient,
	HttpRequest,
} from '@activepieces/pieces-common';
import {
	BaseResponse,
	GetTableResponse,
	ListAPIResponse,
	ListRecordsParams,
	TableResponse,
	WorkspaceResponse,
} from './types';

export class NocoDBClient {
	constructor(private hostUrl: string, private apiToken: string) {}

	async makeRequest<T extends HttpMessageBody>(
		method: HttpMethod,
		resourceUri: string,
		query?: Record<string, string | number | string[] | undefined>,
		body: Record<string, unknown> | undefined = undefined,
	): Promise<T> {
		const baseUrl = this.hostUrl.replace(/\/$/, '');
		const params: QueryParams = {};
		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value !== null && value !== undefined) {
					params[key] = String(value);
				}
			}
		}
		const request: HttpRequest = {
			method: method,
			url: baseUrl + '/api' + resourceUri,
			headers: {
				'xc-token': this.apiToken,
			},
			queryParams: params,
			body: body,
		};
		const response = await httpClient.sendRequest<T>(request);
		return response.body;
	}

	async listWorkspaces(): Promise<ListAPIResponse<WorkspaceResponse>> {
		return await this.makeRequest<ListAPIResponse<WorkspaceResponse>>(
			HttpMethod.GET,
			'/v1/workspaces/',
		);
	}

	async listBases(workspaceId?: string, version = 3): Promise<ListAPIResponse<BaseResponse>> {
		if (workspaceId && workspaceId !== 'none') {
			// Cloud version
			const endpoint = `/v1/workspaces/${workspaceId}/bases/`;
			return await this.makeRequest<ListAPIResponse<BaseResponse>>(
				HttpMethod.GET,
				endpoint,
			);
		} else {
			// Self-hosted version
			const endpoint = version === 3 ? '/v2/meta/bases/' : '/v1/db/meta/projects/';
			return await this.makeRequest<ListAPIResponse<BaseResponse>>(
				HttpMethod.GET,
				endpoint,
			);
		}
	}

	async listTables(baseId: string, version = 3): Promise<ListAPIResponse<TableResponse>> {
		const endpoint = version === 3
			? `/v2/meta/bases/${baseId}/tables`
			: `/v1/db/meta/projects/${baseId}/tables`;
		return await this.makeRequest<ListAPIResponse<TableResponse>>(
			HttpMethod.GET,
			endpoint,
		);
	}

	async getTable(tableId: string, version = 3): Promise<GetTableResponse> {
		const endpoint = version === 3
			? `/v2/meta/tables/${tableId}/`
			: `/v1/db/meta/tables/${tableId}/`;
		return await this.makeRequest<GetTableResponse>(HttpMethod.GET, endpoint);
	}

	async createRecord(tableId: string, recordInput: Record<string, unknown>, version = 3) {
		const endpoint = version === 3
			? `/v2/tables/${tableId}/records`
			: `/v1/db/data/noco/${tableId}`;
		return await this.makeRequest(
			HttpMethod.POST,
			endpoint,
			undefined,
			recordInput
		);
	}

	async getRecord(tableId: string, recordId: number, version = 3) {
		const endpoint = version === 3
			? `/v2/tables/${tableId}/records/${recordId}`
			: `/v1/db/data/noco/${tableId}/${recordId}`;
		return await this.makeRequest(HttpMethod.GET, endpoint);
	}

	async updateRecord(tableId: string, recordInput: Record<string, unknown>, version = 3) {
		const endpoint = version === 3
			? `/v2/tables/${tableId}/records/`
			: `/v1/db/data/noco/${tableId}`;
		return await this.makeRequest(
			HttpMethod.PATCH,
			endpoint,
			undefined,
			recordInput,
		);
	}

	async deleteRecord(tableId: string, recordId: number, version = 3) {
		const endpoint = version === 3
			? `/v2/tables/${tableId}/records/`
			: `/v1/db/data/noco/${tableId}/${recordId}`;
		const body = version === 3 ? { Id: recordId } : undefined;
		return await this.makeRequest(
			HttpMethod.DELETE,
			endpoint,
			undefined,
			body
		);
	}

	async listRecords(
		tableId: string,
		params: ListRecordsParams,
		version = 3
	): Promise<ListAPIResponse<Record<string, unknown>>> {
		const endpoint = version === 3
			? `/v2/tables/${tableId}/records/`
			: `/v1/db/data/noco/${tableId}`;
		return await this.makeRequest<ListAPIResponse<Record<string, unknown>>>(
			HttpMethod.GET,
			endpoint,
			params,
		);
	}
}
