import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';

export class WebflowApiClient {
	constructor(private accessToken: string) {}

	async makeRequest(
		method: HttpMethod,
		resourceUri: string,
		query?: Record<string, string | number | string[] | undefined>,
		body: any | undefined = undefined,
	): Promise<any> {
		const apiUrl = 'https://api.webflow.com';
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
			url: apiUrl + resourceUri,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.accessToken,
			},
			queryParams: params,
			body: body,
		};

		const response = await httpClient.sendRequest(request);
		return response.body;
	}

	async listSites() {
		return await this.makeRequest(HttpMethod.GET, '/sites');
	}

	async listCollections(siteId: string) {
		return await this.makeRequest(HttpMethod.GET, `/sites/${siteId}/collections`);
	}

	async getCollection(collectionId: string) {
		return await this.makeRequest(HttpMethod.GET, `/collections/${collectionId}`);
	}

	async createCollectionItem(collectionId: string, request: Record<string, any>) {
		return await this.makeRequest(
			HttpMethod.POST,
			`/collections/${collectionId}/items`,
			undefined,
			request,
		);
	}

	async updateCollectionItem(collectionId: string, itemId: string, request: Record<string, any>) {
		return await this.makeRequest(
			HttpMethod.PUT,
			`/collections/${collectionId}/items/${itemId}`,
			undefined,
			request,
		);
	}

	async getCollectionItem(collectionId: string, itemId: string) {
		return await this.makeRequest(HttpMethod.GET, `/collections/${collectionId}/items/${itemId}`);
	}

	async deleteCollectionItem(collectionId: string, itemId: string) {
		return await this.makeRequest(
			HttpMethod.DELETE,
			`/collections/${collectionId}/items/${itemId}`,
		);
	}

	async publishCollectionItem(collectionId: string, itemId: string) {
		return await this.makeRequest(
			HttpMethod.POST,
			`/collections/${collectionId}/items/publish`,
			undefined,
			{ itemIds: [itemId] },
		);
	}

	async listCollectionItems(collectionId: string, page: number, limit: number) {
		return await this.makeRequest(HttpMethod.GET, `/collections/${collectionId}/items`, {
			offset: page,
			limit,
		});
	}

	async getOrder(siteId: string, orderId: string) {
		return await this.makeRequest(HttpMethod.GET, `/sites/${siteId}/orders/${orderId}`);
	}

	async fulfillOrder(siteId: string, orderId: string, request: Record<string, any>) {
		return await this.makeRequest(
			HttpMethod.POST,
			`/sites/${siteId}/orders/${orderId}/fulfill`,
			undefined,
			request,
		);
	}

	async unfulfillOrder(siteId: string, orderId: string) {
		return await this.makeRequest(
			HttpMethod.POST,
			`/sites/${siteId}/orders/${orderId}/unfulfill`,
			undefined,
		);
	}

	async refundOrder(siteId: string, orderId: string) {
		return await this.makeRequest(HttpMethod.POST, `/sites/${siteId}/orders/${orderId}/refund`);
	}

	async listOrders(siteId: string, page: number, limit: number) {
		return await this.makeRequest(HttpMethod.GET, `/sites/${siteId}/orders`, {
			offset: page,
			limit,
		});
	}

	async createWebhook(siteId: string, triggerType: string, webhookUrl: string) {
		return await this.makeRequest(
			HttpMethod.POST,
			`'/sites/${siteId}/webhooks`,
			{},
			{
				triggerType,
				url: webhookUrl,
			},
		);
	}

	async deleteWebhook(webhookId: string) {
		return await this.makeRequest(HttpMethod.DELETE, `/webhooks/${webhookId}`);
	}
}
