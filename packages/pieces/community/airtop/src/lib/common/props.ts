import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from './client';

interface Window {
	windowId: string;
	targetId: string;
}

interface PropsValue {
	sessionId: string;
}

export const sessionId = Property.Dropdown({
	displayName: 'Session',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your Airtop account.',
			};
		}

		const response = await airtopApiCall<any>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: '/sessions',
			query: {
				limit: 1000,
				page: 1,
			},
		});

		const sessions = response?.data?.sessions ?? [];

		return {
			disabled: false,
			options: sessions.map((session: any) => ({
				label: `${session.id} (${session.status})`,
				value: session.id,
			})),
		};
	},
});

export const windowId = Property.Dropdown({
	displayName: 'Window',
	refreshers: ['sessionId'],
	required: true,
	options: async ({ auth, propsValue }) => {
		const { sessionId } = propsValue as PropsValue;

		if (!auth || !sessionId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Select a session first.',
			};
		}

		const response = await airtopApiCall<{
			data?: { windows: Window[] };
		}>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: `/sessions/${sessionId}/windows`,
		});

		const windows = response?.data?.windows ?? [];

		return {
			disabled: false,
			options: windows.map((win) => ({
				label: win.windowId,
				value: win.windowId,
			})),
		};
	},
});

export const fileId = Property.Dropdown({
	displayName: 'File',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Connect your Airtop account.',
			};
		}

		const response = await airtopApiCall<any>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: '/files',
			query: {
				limit: 1000,
				page: 1,
			},
		});

		const files = response?.data?.files ?? [];

		return {
			disabled: false,
			options: files.map((file: any) => ({
				label: `${file.fileName} (${file.fileType})`,
				value: file.id,
			})),
		};
	},
});
