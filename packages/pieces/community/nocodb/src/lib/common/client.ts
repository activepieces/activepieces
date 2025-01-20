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
		body: any | undefined = undefined,
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

	async listBases(workspaceId: string): Promise<ListAPIResponse<BaseResponse>> {
		return await this.makeRequest<ListAPIResponse<BaseResponse>>(
			HttpMethod.GET,
			`/v1/workspaces/${workspaceId}/bases/`,
		);
	}

	async listTables(baseId: string): Promise<ListAPIResponse<TableResponse>> {
		return await this.makeRequest<ListAPIResponse<TableResponse>>(
			HttpMethod.GET,
			`/v2/meta/bases/${baseId}/tables/`,
		);
	}

	async getTable(tableId: string): Promise<GetTableResponse> {
		return await this.makeRequest<GetTableResponse>(HttpMethod.GET, `/v2/meta/tables/${tableId}/`);
	}

	async createRecord(tableId: string, recordInput: Record<string, any>) {
		return await this.makeRequest(
			HttpMethod.POST,
			`/v2/tables/${tableId}/records/`,
			undefined,
			recordInput,
		);
	}

	async getRecord(tableId: string, recordId: number) {
		return await this.makeRequest(HttpMethod.GET, `/v2/tables/${tableId}/records/${recordId}`);
	}

	async updateRecord(tableId: string, recordInput: Record<string, any>) {
		return await this.makeRequest(
			HttpMethod.PATCH,
			`/v2/tables/${tableId}/records/`,
			undefined,
			recordInput,
		);
	}

	async deleteRecord(tableId: string, recordId: number) {
		return await this.makeRequest(HttpMethod.DELETE, `/v2/tables/${tableId}/records/`, undefined, {
			Id: recordId,
		});
	}

	async listRecords(
		tableId: string,
		params: ListRecordsParams,
	): Promise<ListAPIResponse<Record<string, any>>> {
		return await this.makeRequest<ListAPIResponse<Record<string, any>>>(
			HttpMethod.GET,
			`/v2/tables/${tableId}/records/`,
			params,
		);
	}
}
