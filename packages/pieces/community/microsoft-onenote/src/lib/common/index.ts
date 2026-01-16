import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export async function getNotebooksDropdown(auth: OAuth2PropertyValue) {
	const client = Client.initWithMiddleware({
		authProvider: {
			getAccessToken: () => Promise.resolve(auth.access_token),
		},
	});

	try {
		const response = await client.api('/me/onenote/notebooks').get();
		
		// Check if response.value exists and is an array
		if (!response || !response.value || !Array.isArray(response.value)) {
			console.error('Invalid response structure from Microsoft Graph API:', response);
			return {
				disabled: true,
				placeholder: 'Failed to load notebooks: Invalid response format',
				options: [],
			};
		}

		// Handle empty array case
		if (response.value.length === 0) {
			return {
				disabled: false,
				options: [],
			};
		}

		return {
			disabled: false,
			options: response.value.map((notebook: any) => ({
				label: notebook.displayName || 'Untitled Notebook',
				value: notebook.id,
			})),
		};
	} catch (error: any) {
		console.error('Error fetching notebooks:', error);
		
		// Provide more specific error messages based on error type
		let errorMessage = 'Failed to load notebooks';
		if (error?.statusCode === 403 || error?.code === 'Forbidden') {
			errorMessage = 'Failed to load notebooks: Insufficient permissions. Please ensure Notes.Read.All scope is granted.';
		} else if (error?.statusCode === 401 || error?.code === 'Unauthorized') {
			errorMessage = 'Failed to load notebooks: Authentication failed. Please reconnect your account.';
		} else if (error?.message) {
			errorMessage = `Failed to load notebooks: ${error.message}`;
		}
		
		return {
			disabled: true,
			placeholder: errorMessage,
			options: [],
		};
	}
}

export async function getSectionsDropdown(auth: OAuth2PropertyValue) {
	const client = Client.initWithMiddleware({
		authProvider: {
			getAccessToken: () => Promise.resolve(auth.access_token),
		},
	});

	try {
		const response = await client.api('/me/onenote/sections').get();
		
		return {
			disabled: false,
			options: response.value.map((section: any) => ({
				label: section.displayName,
				value: section.id,
			})),
		};
	} catch (error) {
		console.error('Error fetching sections:', error);
		return {
			disabled: true,
			placeholder: 'Failed to load sections',
			options: [],
		};
	}
}

export async function getPagesDropdown(auth: OAuth2PropertyValue) {
	const client = Client.initWithMiddleware({
		authProvider: {
			getAccessToken: () => Promise.resolve(auth.access_token),
		},
	});

	try {
		const response = await client.api('/me/onenote/pages').get();
		
		return {
			disabled: false,
			options: response.value.map((page: any) => ({
				label: page.title,
				value: page.id,
			})),
		};
	} catch (error) {
		console.error('Error fetching pages:', error);
		return {
			disabled: true,
			placeholder: 'Failed to load pages',
			options: [],
		};
	}
}

export async function getSectionsByNotebookDropdown(auth: OAuth2PropertyValue, notebookId: string) {
	const client = Client.initWithMiddleware({
		authProvider: {
			getAccessToken: () => Promise.resolve(auth.access_token),
		},
	});

	try {
		const response = await client.api(`/me/onenote/notebooks/${notebookId}/sections`).get();
		
		return {
			disabled: false,
			options: response.value.map((section: any) => ({
				label: section.displayName,
				value: section.id,
			})),
		};
	} catch (error) {
		console.error('Error fetching sections for notebook:', error);
		return {
			disabled: true,
			placeholder: 'Failed to load sections',
			options: [],
		};
	}
}

export async function getPagesBySectionDropdown(auth: OAuth2PropertyValue, sectionId: string) {
	const client = Client.initWithMiddleware({
		authProvider: {
			getAccessToken: () => Promise.resolve(auth.access_token),
		},
	});

	try {
		const response = await client.api(`/me/onenote/sections/${sectionId}/pages`).get();
		
		return {
			disabled: false,
			options: response.value.map((page: any) => ({
				label: page.title,
				value: page.id,
			})),
		};
	} catch (error) {
		console.error('Error fetching pages for section:', error);
		return {
			disabled: true,
			placeholder: 'Failed to load pages',
			options: [],
		};
	}
}
