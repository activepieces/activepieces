import { businessCentralAuth } from '../../';
import {
	HttpMessageBody,
	HttpMethod,
	QueryParams,
	httpClient,
	HttpRequest,
	AuthenticationType,
	HttpHeaders,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';

interface ListAPIResponse<T> {
	'@odata.context': string;
	value: Array<T>;
}

interface CompanyResponse {
	id: string;
	name: string;
}

export class BusinessCentralAPIClient {
	constructor(private environment: string, private accessToken: string) {}

	async makeRequest<T extends HttpMessageBody>(
		method: HttpMethod,
		resourceUri: string,
		query?: Record<string, string | number | string[] | undefined>,
		body: any | undefined = undefined,
	): Promise<T> {
		const baseUrl = `https://api.businesscentral.dynamics.com/v2.0/${this.environment}/api/v2.0`;
		const params: QueryParams = {};
		const headers: HttpHeaders = {};

		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value !== null && value !== undefined) {
					params[key] = String(value);
				}
			}
		}

		if (method === HttpMethod.PATCH || method === HttpMethod.DELETE) {
			headers['If-Match'] = '*';
		}

		const request: HttpRequest = {
			method: method,
			url: baseUrl + resourceUri,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.accessToken,
			},
			headers,
			queryParams: params,
			body: body,
		};

		const response = await httpClient.sendRequest<T>(request);
		return response.body;
	}

	async listCompanies(): Promise<ListAPIResponse<CompanyResponse>> {
		return await this.makeRequest(HttpMethod.GET, '/companies');
	}

	async createRecord(companyId: string, recordType: string, request: Record<string, any>) {
		return await this.makeRequest(
			HttpMethod.POST,
			`/companies(${companyId})/${recordType}`,
			undefined,
			request,
		);
	}

	async updateRecord(
		companyId: string,
		recordType: string,
		recordId: string,
		request: Record<string, any>,
	) {
		return await this.makeRequest(
			HttpMethod.PATCH,
			`/companies(${companyId})/${recordType}(${recordId})`,
			undefined,
			request,
		);
	}

	async getRecord(companyId: string, recordType: string, recordId: string) {
		return await this.makeRequest(
			HttpMethod.GET,
			`/companies(${companyId})/${recordType}(${recordId})`,
		);
	}

	async deleteRecord(companyId: string, recordType: string, recordId: string) {
		return await this.makeRequest(
			HttpMethod.DELETE,
			`/companies(${companyId})/${recordType}(${recordId})`,
		);
	}
}

export function makeClient(auth: PiecePropValueSchema<typeof businessCentralAuth>) {
	const client = new BusinessCentralAPIClient(auth.props?.['environment'], auth.access_token);
	return client;
}
