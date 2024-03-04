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
	CreateInvoiceParameters,
	GetCustomerParameters,
	GetCustomerResponse,
	QueryClassResponse,
	QueryCompanyCurrencyResponse,
	QueryCustomerResponse,
	QueryItemResponse,
	QueryParameters,
	QueryPaymentMethodResponse,
	QueryTaxCodeResponse,
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
			throw new Error(JSON.stringify((error as Error).message));
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
		query: (args: QueryParameters): Promise<QueryCustomerResponse> => {
			return this.makeRequest<QueryCustomerResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
	invoices = {
		/**
		 * Create a invoice
		 */
		create: (args: CreateInvoiceParameters) => {
			return this.makeRequest({
				path: '/invoice',
				method: HttpMethod.POST,
				body: args,
			});
		},
	};
	companycurrencies = {
		/**
		 * Query company currencies
		 */
		query: (args: QueryParameters): Promise<QueryCompanyCurrencyResponse> => {
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
		query: (args: QueryParameters): Promise<QueryItemResponse> => {
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
		query: (args: QueryParameters): Promise<QueryPaymentMethodResponse> => {
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
		query: (args: QueryParameters): Promise<QueryTermResponse> => {
			return this.makeRequest<QueryTermResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
	classes = {
		/**
		 * Query classes
		 */
		query: (args: QueryParameters): Promise<QueryClassResponse> => {
			return this.makeRequest<QueryClassResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
	taxcodes = {
		/**
		 * Query tax codes
		 */
		query: (args: QueryParameters): Promise<QueryTaxCodeResponse> => {
			return this.makeRequest<QueryTaxCodeResponse>({
				path: '/query',
				method: HttpMethod.GET,
				query: { query: args.query },
			});
		},
	};
}
