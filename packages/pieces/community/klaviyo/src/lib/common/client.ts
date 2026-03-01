import {
	HttpMessageBody,
	HttpMethod,
	QueryParams,
	httpClient,
	HttpRequest,
} from '@activepieces/pieces-common';

export class KlaviyoClient {
	constructor(private apiKey: string) {}

	async makeRequest<T extends HttpMessageBody>(
		method: HttpMethod,
		resourceUri: string,
		query?: QueryParams,
		body: any | undefined = undefined,
	): Promise<T> {
		const request: HttpRequest = {
			method: method,
			url: 'https://a.klaviyo.com/api' + resourceUri,
			headers: {
				'Authorization': `Klaviyo-V3 ${this.apiKey}`,
				'revision': '2024-10-15',
				'Accept': 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			queryParams: query,
			body: body,
		};
		const res = await httpClient.sendRequest<T>(request);
		return res.body;
	}

	async listLists() {
		return await this.makeRequest<any>(HttpMethod.GET, '/lists/');
	}

	async createProfile(profile: any) {
		return await this.makeRequest<any>(HttpMethod.POST, '/profiles/', undefined, {
			data: {
				type: 'profile',
				attributes: profile,
			},
		});
	}

	async updateProfile(profileId: string, profile: any) {
		return await this.makeRequest<any>(HttpMethod.PATCH, `/profiles/${profileId}/`, undefined, {
			data: {
				type: 'profile',
				id: profileId,
				attributes: profile,
			},
		});
	}

	async getProfileByEmail(email: string) {
		return await this.makeRequest<any>(HttpMethod.GET, '/profiles/', {
			'filter': `equals(email,"${email}")`,
		});
	}

	async addProfileToList(listId: string, profileId: string) {
		return await this.makeRequest<any>(HttpMethod.POST, `/lists/${listId}/relationships/profiles/`, undefined, {
			data: [
				{
					type: 'profile',
					id: profileId,
				},
			],
		});
	}

	async removeProfileFromList(listId: string, profileId: string) {
		return await this.makeRequest<any>(HttpMethod.DELETE, `/lists/${listId}/relationships/profiles/`, undefined, {
			data: [
				{
					type: 'profile',
					id: profileId,
				},
			],
		});
	}

	async createList(name: string) {
		return await this.makeRequest<any>(HttpMethod.POST, '/lists/', undefined, {
			data: {
				type: 'list',
				attributes: {
					name: name,
				},
			},
		});
	}

	async listSegments() {
		return await this.makeRequest<any>(HttpMethod.GET, '/segments/');
	}
}
