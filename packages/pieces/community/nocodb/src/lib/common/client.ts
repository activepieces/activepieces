import {
	HttpMessageBody,
	HttpMethod,
	QueryParams,
	httpClient,
	HttpRequest,
} from '@activepieces/pieces-common';
import { BaseResponse, ListAPIResponse, TableResponse, WorkspaceResponse } from './types';

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
				'xc-auth': this.apiToken,
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

	async listBases(workspaceId: string): Promise<ListAPIResponse<WorkspaceResponse>> {
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
}
