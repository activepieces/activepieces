import {
	HttpMessageBody,
	HttpMethod,
	QueryParams,
	httpClient,
	HttpRequest,
	AuthenticationType,
} from '@activepieces/pieces-common';
import {
	CreateCustomerParameters,
	CreateCustomerResponse,
	GetCustomerParameters,
	GetCustomerResponse,
	QueryCompanyCurrencyParameters,
	QueryCompanyCurrencyResponse,
	QueryCustomerParameters,
	QueryCustomerResponse,
	QueryItemParameters,
	QueryItemResponse,
	QueryPaymentMethodParameters,
	QueryPaymentMethodResponse,
	QueryTermParameters,
	QueryTermResponse,
	UpdateCustomerParameters,
	UpdateCustomerResponse,
} from './types';

interface RequestParameters {
	path: string;
	method: HttpMethod;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any | undefined;
}

interface ClientOptions {
	accessToken: string;
	companyId: string;
}

export class QuickBooksAPIClient {
	private accessToken: string;
	private companyId: string;

	constructor(options: ClientOptions) {
		this.accessToken = options.accessToken;
		this.companyId = options.companyId;
	}
	/**
	 * Sends a request.
	 */
	async makeRequest<ResponseBody extends HttpMessageBody>({
		path,
		method,
		query,
		body,
	}: RequestParameters): Promise<ResponseBody> {
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
			url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${this.companyId}` + path,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.accessToken,
			},
			headers: { accept: 'application/json' },
			queryParams: { minorversion: '70', ...params },
			body: body,
		};

		try {
			const response = await httpClient.sendRequest<ResponseBody>(request);
			return response.body;
		} catch (error) {
			throw new Error(JSON.stringify(error));
		}
	}
	customers = {
		/**
		 * Create a customer
		 */
		create: (args: CreateCustomerParameters): Promise<CreateCustomerResponse> => {
			return this.makeRequest<CreateCustomerResponse>({
				path: '/customer',
				method: HttpMethod.POST,
				body: args,
			});
		},
		/**
		 * Update a customer
		 */
		update: (args: UpdateCustomerParameters): Promise<UpdateCustomerResponse> => {
			return this.makeRequest<UpdateCustomerResponse>({
				path: '/customer',
				method: HttpMethod.POST,
				body: args,
			});
		},
		/**
		 * Retrieve a customer
		 */
		retrieve: (args: GetCustomerParameters): Promise<GetCustomerResponse> => {
			return this.makeRequest<GetCustomerResponse>({
				path: `/customer/${args.customerId}`,
				method: HttpMethod.GET,
			});
		},
		/**
		 * Query customers
		 */
		query: (args: QueryCustomerParameters): Promise<QueryCustomerResponse> => {
			return this.makeRequest<QueryCustomerResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
	companycurrencies = {
		/**
		 * Query company currencies
		 */
		query: (args: QueryCompanyCurrencyParameters): Promise<QueryCompanyCurrencyResponse> => {
			return this.makeRequest<QueryCompanyCurrencyResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
	items = {
		/**
		 * Query items
		 */
		query: (args: QueryItemParameters): Promise<QueryItemResponse> => {
			return this.makeRequest<QueryItemResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
	paymentmethods = {
		/**
		 * Query payment methods
		 */
		query: (args: QueryPaymentMethodParameters): Promise<QueryPaymentMethodResponse> => {
			return this.makeRequest<QueryPaymentMethodResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
	terms = {
		/**
		 * Query terms
		 */
		query: (args: QueryTermParameters): Promise<QueryTermResponse> => {
			return this.makeRequest<QueryTermResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
}
