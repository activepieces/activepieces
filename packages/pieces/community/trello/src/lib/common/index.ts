import { BasicAuthPropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpRequest, HttpMethod } from '@activepieces/pieces-common';

export interface WebhookInformation {
	id: string;
	description: string;
	idModel: string;
	callbackURL: string;
	active: boolean;
	consecutiveFailures: number;
	firstConsecutiveFailDate: string;
}

export const trelloCommon = {
	baseUrl: 'https://api.trello.com/1/',
	board_id: Property.Dropdown({
		displayName: 'Boards',
		description: 'List of boards',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'connect your account first',
					options: [],
				};
			}

			const basicAuthProperty = auth as BasicAuthPropertyValue;
			const user = await getAuthorisedUser(basicAuthProperty.username, basicAuthProperty.password);
			const boards = await listBoards(
				basicAuthProperty.username,
				basicAuthProperty.password,
				user['id'],
			);

			return {
				options: boards.map((board: { id: string; name: string }) => ({
					value: board.id,
					label: board.name,
				})),
			};
		},
	}),
	list_id: Property.Dropdown({
		displayName: 'Lists',
		description: 'Get lists from a board',
		required: true,
		refreshers: ['board_id'],
		options: async ({ auth, board_id }) => {
			if (!auth || !board_id) {
				return {
					disabled: true,
					placeholder: 'connect your account first and select a board',
					options: [],
				};
			}

			const basicAuthProperty = auth as BasicAuthPropertyValue;
			const lists = await listBoardLists(
				basicAuthProperty.username,
				basicAuthProperty.password,
				board_id as string,
			);

			return {
				options: lists.map((list: { id: string; name: string }) => ({
					value: list.id,
					label: list.name,
				})),
			};
		},
	}),
	list_id_opt: Property.Dropdown({
		displayName: 'Lists',
		description: 'Get lists from a board',
		required: false,
		refreshers: ['board_id'],
		options: async ({ auth, board_id }) => {
			if (!auth || !board_id) {
				return {
					disabled: true,
					placeholder: 'connect your account first and select a board',
					options: [],
				};
			}
			const basicAuthProperty = auth as BasicAuthPropertyValue;
			const lists = await listBoardLists(
				basicAuthProperty.username,
				basicAuthProperty.password,
				board_id as string,
			);

			return {
				options: lists.map((list: { id: string; name: string }) => ({
					value: list.id,
					label: list.name,
				})),
			};
		},
	}),
	board_labels: Property.MultiSelectDropdown({
		displayName: 'Labels',
		description: 'Assign labels to the card',
		required: false,
		refreshers: ['board_id'],
		options: async ({ auth, board_id }) => {
			if (!auth || !board_id) {
				return {
					disabled: true,
					placeholder: 'connect your account first and select a board',
					options: [],
				};
			}

			const basicAuthProperty = auth as BasicAuthPropertyValue;
			const labels = await listBoardLabels(
				basicAuthProperty.username,
				basicAuthProperty.password,
				board_id as string,
			);

			return {
				options: labels.map((label: { id: string; name: string; color: string }) => ({
					label: label.name || label.color,
					value: label.id,
				})),
			};
		},
	}),
	create_webhook: async (auth: BasicAuthPropertyValue, list_id: string, webhookUrl: string) => {
		const request: HttpRequest = {
			method: HttpMethod.POST,
			url:
				`${trelloCommon.baseUrl}webhooks` +
				`?key=` +
				auth.username +
				`&token=` +
				auth.password +
				`&callbackURL=` +
				webhookUrl +
				`&idModel=` +
				list_id,
		};
		const response = await httpClient.sendRequest<WebhookInformation>(request);

		return response.body;
	},
	delete_webhook: async (auth: BasicAuthPropertyValue, webhook_id: string) => {
		const request: HttpRequest = {
			method: HttpMethod.DELETE,
			url:
				`${trelloCommon.baseUrl}webhooks/${webhook_id}` +
				`?key=` +
				auth.username +
				`&token=` +
				auth.password,
		};
		const response = await httpClient.sendRequest(request);

		return response.body;
	},
	list_webhooks: async (auth: BasicAuthPropertyValue) => {
		const request: HttpRequest = {
			method: HttpMethod.GET,
			url: `${trelloCommon.baseUrl}tokens/${auth.password}/webhooks` + `?key=` + auth.username,
		};
		const response = await httpClient.sendRequest<WebhookInformation[]>(request);

		return response.body;
	},
};

/**
 * Gets the authenticated user via API and token
 * @param apikey API Key
 * @param token  Token Key
 * @returns JSON containing Trello user
 */
async function getAuthorisedUser(apikey: string, token: string) {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${trelloCommon.baseUrl}members/me` + `?key=` + apikey + `&token=` + token,
		headers: {
			Accept: 'application/json',
		},
	};
	const response = await httpClient.sendRequest(request);

	return response.body;
}

/**
 * Lists all boards a member has access to in Trello
 * @param apikey API Key
 * @param token  API Token
 * @param user_id ID of the user
 * @returns JSON Array of boards user has access to
 */
async function listBoards(apikey: string, token: string, user_id: string) {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${trelloCommon.baseUrl}members/${user_id}/boards` + `?key=` + apikey + `&token=` + token,
		headers: {
			Accept: 'application/json',
		},
	};
	const response = await httpClient.sendRequest<{ id: string; name: string }[]>(request);

	return response.body;
}

/**
 * Gets all the lists inside of a board
 * @param apikey API Key
 * @param token  API Token
 * @param board_id Board to fetch lists from
 * @returns JSON Array of lists
 */
async function listBoardLists(apikey: string, token: string, board_id: string) {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${trelloCommon.baseUrl}boards/${board_id}/lists` + `?key=` + apikey + `&token=` + token,
		headers: {
			Accept: 'application/json',
		},
	};
	const response = await httpClient.sendRequest<{ id: string; name: string }[]>(request);

	return response.body;
}

/**
 * Gets all the labels of a board
 * @param apikey API Key
 * @param token  API Token
 * @param board_id Board to fetch labels from
 * @returns JSON Array of labels
 */
async function listBoardLabels(apikey: string, token: string, board_id: string) {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${trelloCommon.baseUrl}boards/${board_id}/labels` + `?key=` + apikey + `&token=` + token,
		headers: {
			Accept: 'application/json',
		},
	};
	const response = await httpClient.sendRequest<{ id: string; name: string; color: string }[]>(
		request,
	);

	return response.body;
}

export async function getCardDetail(apikey: string, token: string, card_id: string) {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${trelloCommon.baseUrl}cards/${card_id}` + `?key=` + apikey + `&token=` + token,
		headers: {
			Accept: 'application/json',
		},
	};

	const response = await httpClient.sendRequest(request);
	return response.body;
}

export async function getCardsInBoard(apikey: string, token: string, board_id: string) {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${trelloCommon.baseUrl}boards/${board_id}/cards` + `?key=` + apikey + `&token=` + token,
		headers: {
			Accept: 'application/json',
		},
	};

	const response = await httpClient.sendRequest(request);
	return response.body;
}

export async function getCardsInList(apikey: string, token: string, list_id: string) {
	const request: HttpRequest = {
		method: HttpMethod.GET,
		url: `${trelloCommon.baseUrl}lists/${list_id}/cards` + `?key=` + apikey + `&token=` + token,
		headers: {
			Accept: 'application/json',
		},
	};

	const response = await httpClient.sendRequest(request);
	return response.body;
}
