import { BasicAuthPropertyValue, DropdownState, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpRequest, HttpMethod } from '@activepieces/pieces-common';
import { trelloAuth } from '../..';

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
	board_id:  Property.Dropdown({
		auth: trelloAuth,

		displayName: 'Board',
		description: 'Pick a board to load its lists.',
		required: true,
		refreshers: [],
		options: async ({ auth }) => loadBoardOptions({ auth }),
	}),
	list_id:  Property.Dropdown({
		auth: trelloAuth,

		displayName: 'List',
		required: true,
		refreshers: ['board_id'],
		options: async ({ auth, board_id }) => loadListOptions({ auth, boardId: board_id }),
	}),
	list_id_opt:  Property.Dropdown({
		auth: trelloAuth,

		displayName: 'List',
		description: 'Leave empty to use every list on the board.',
		required: false,
		refreshers: ['board_id'],
		options: async ({ auth, board_id }) => loadListOptions({ auth, boardId: board_id }),
	}),
	move_to_list:  Property.Dropdown({
		auth: trelloAuth,

		displayName: 'Move to List',
		description: 'Leave empty to keep the card in its current list.',
		required: false,
		refreshers: ['board_id'],
		options: async ({ auth, board_id }) => loadListOptions({ auth, boardId: board_id }),
	}),
	board_id_opt:  Property.Dropdown({
		auth: trelloAuth,

		displayName: 'Board',
		description: "Loads the board's labels and lists below.",
		required: false,
		refreshers: [],
		options: async ({ auth }) => loadBoardOptions({ auth }),
	}),
	board_labels: Property.MultiSelectDropdown({
		auth: trelloAuth,
		displayName: 'Labels',
		required: false,
		refreshers: ['board_id'],
		options: async ({ auth, board_id }) => loadLabelOptions({ auth, boardId: board_id }),
	}),
	board_labels_replace: Property.MultiSelectDropdown({
		auth: trelloAuth,
		displayName: 'Labels',
		description: "Replaces the card's labels. Leave empty to keep them.",
		required: false,
		refreshers: ['board_id'],
		options: async ({ auth, board_id }) => loadLabelOptions({ auth, boardId: board_id }),
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

async function loadBoardOptions({
	auth,
}: {
	auth: BasicAuthPropertyValue | undefined;
}): Promise<DropdownState<string>> {
	if (!auth) {
		return {
			disabled: true,
			placeholder: 'Connect your Trello account first.',
			options: [],
		};
	}

	try {
		const user = await getAuthorisedUser(auth.username, auth.password);
		const boards = await listBoards(auth.username, auth.password, user['id']);
		if (boards.length === 0) {
			return {
				disabled: false,
				options: [],
				placeholder: 'No boards found. Create one in Trello first.',
			};
		}

		return {
			options: boards.map((board) => ({
				value: board.id,
				label: board.name,
			})),
		};
	} catch {
		return {
			disabled: true,
			options: [],
			placeholder: "Couldn't load boards. Check your connection.",
		};
	}
}

async function loadListOptions({
	auth,
	boardId,
}: {
	auth: BasicAuthPropertyValue | undefined;
	boardId: unknown;
}): Promise<DropdownState<string>> {
	if (!auth) {
		return {
			disabled: true,
			placeholder: 'Connect your Trello account first.',
			options: [],
		};
	}
	if (typeof boardId !== 'string' || boardId === '') {
		return {
			disabled: true,
			placeholder: 'Select a board first.',
			options: [],
		};
	}

	try {
		const lists = await listBoardLists(auth.username, auth.password, boardId);
		if (lists.length === 0) {
			return {
				disabled: false,
				options: [],
				placeholder: 'No lists on this board.',
			};
		}

		return {
			options: lists.map((list) => ({
				value: list.id,
				label: list.name,
			})),
		};
	} catch {
		return {
			disabled: true,
			options: [],
			placeholder: "Couldn't load lists. Check your connection.",
		};
	}
}

async function loadLabelOptions({
	auth,
	boardId,
}: {
	auth: BasicAuthPropertyValue | undefined;
	boardId: unknown;
}): Promise<DropdownState<string>> {
	if (!auth) {
		return {
			disabled: true,
			placeholder: 'Connect your Trello account first.',
			options: [],
		};
	}
	if (typeof boardId !== 'string' || boardId === '') {
		return {
			disabled: true,
			placeholder: 'Select a board first.',
			options: [],
		};
	}

	try {
		const labels = await listBoardLabels(auth.username, auth.password, boardId);
		if (labels.length === 0) {
			return {
				disabled: false,
				options: [],
				placeholder: 'No labels on this board.',
			};
		}

		return {
			options: labels.map((label) => ({
				label: label.name || label.color,
				value: label.id,
			})),
		};
	} catch {
		return {
			disabled: true,
			options: [],
			placeholder: "Couldn't load labels. Check your connection.",
		};
	}
}

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
		url:
			`${trelloCommon.baseUrl}boards/${board_id}/labels` +
			`?key=` +
			apikey +
			`&token=` +
			token +
			`&limit=1000`,
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
