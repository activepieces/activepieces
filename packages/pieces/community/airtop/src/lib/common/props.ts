import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { airtopApiCall, extractApiData, AirtopSession, AirtopWindow, AirtopFile } from './client';


export const sessionId = Property.Dropdown({
	displayName: 'Session',
	description: 'Select an active Airtop session to use for browser automation',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Connect your Airtop account to load sessions',
			};
		}

		try {
			const response = await airtopApiCall<any>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/sessions',
			});

			const sessions = extractApiData<AirtopSession>(response);
			
			if (sessions.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'No active sessions found. Create a session first.',
				};
			}

			const sortedSessions = sessions.sort((a, b) => {
				if (a.status === 'active' && b.status !== 'active') return -1;
				if (a.status !== 'active' && b.status === 'active') return 1;
				return 0;
			});

			return {
				disabled: false,
				options: sortedSessions.map((session) => ({
					label: `${session.id} (${session.status})`,
					value: session.id,
				})),
				placeholder: 'Select a session',
			};
		} catch (error: any) {
			return {
				disabled: true,
				options: [],
				placeholder: `Error loading sessions: ${error.message}`,
			};
		}
	},
});


export const windowId = Property.Dropdown({
	displayName: 'Window',
	description: 'Select a browser window within the chosen session',
	required: true,
	refreshers: ['sessionId'],
	options: async ({ auth, sessionId }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Connect your Airtop account first',
			};
		}

		if (!sessionId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Select a session first to load windows',
			};
		}

		try {
			const response = await airtopApiCall<any>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: `/sessions/${sessionId}/windows`,
			});

			const windows = extractApiData<AirtopWindow>(response);
			
			if (windows.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'No browser windows found in this session',
				};
			}

			return {
				disabled: false,
				options: windows.map((window) => ({
					label: `${window.windowId}${window.url ? ` - ${window.url}` : ''} (${window.targetId})`,
					value: window.windowId,
				})),
				placeholder: 'Select a browser window',
			};
		} catch (error: any) {
			return {
				disabled: true,
				options: [],
				placeholder: `Error loading windows: ${error.message}`,
			};
		}
	},
});


export const fileId = Property.Dropdown({
	displayName: 'File',
	description: 'Select a file that has been uploaded to Airtop',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Connect your Airtop account to load files',
			};
		}

		try {
			const response = await airtopApiCall<any>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/files',
			});

			const files = extractApiData<AirtopFile>(response);
			
			if (files.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'No files found. Upload a file first.',
				};
			}

			const sortedFiles = files.sort((a, b) => {
				if (a.createdAt && b.createdAt) {
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				}
				return 0;
			});

			return {
				disabled: false,
				options: sortedFiles.map((file) => {
					let label = `${file.fileName} (${file.fileType})`;
					if (file.size) {
						const sizeInKB = Math.round(file.size / 1024);
						label += ` - ${sizeInKB}KB`;
					}
					return {
						label,
						value: file.id,
					};
				}),
				placeholder: 'Select a file',
			};
		} catch (error: any) {
			return {
				disabled: true,
				options: [],
				placeholder: `Error loading files: ${error.message}`,
			};
		}
	},
});


export const createSessionSelector = (displayName: string, description: string) => {
	return Property.Dropdown({
		displayName,
		description,
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your Airtop account first',
				};
			}

			try {
				const response = await airtopApiCall<any>({
					apiKey: auth as string,
					method: HttpMethod.GET,
					resourceUri: '/sessions',
				});

				const sessions = extractApiData<AirtopSession>(response);
				
				return {
					disabled: false,
					options: sessions.map((session) => ({
						label: `${session.id} (${session.status})`,
						value: session.id,
					})),
					placeholder: sessions.length === 0 ? 'No sessions available' : 'Select a session',
				};
			} catch (error: any) {
				return {
					disabled: true,
					options: [],
					placeholder: `Error: ${error.message}`,
				};
			}
		},
	});
};
