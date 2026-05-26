import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from './microsoft-cloud';
import { Client } from '@microsoft/microsoft-graph-client';

function createClient(auth: OAuth2PropertyValue): ReturnType<typeof Client.initWithMiddleware> {
	const cloud = auth.props?.['cloud'] as string | undefined;
	return Client.initWithMiddleware({
		authProvider: {
			getAccessToken: () => Promise.resolve(auth.access_token),
		},
		baseUrl: getGraphBaseUrl(cloud),
	});
}

export async function getNotebooksDropdown(auth: OAuth2PropertyValue) {
	const client = createClient(auth);

	try {
		const response = await client.api('/me/onenote/notebooks').get();

		return {
			disabled: false,
			options: response.value.map((notebook: any) => ({
				label: notebook.displayName,
				value: notebook.id,
			})),
		};
	} catch (error) {
		console.error('Error fetching notebooks:', error);
		return {
			disabled: true,
			placeholder: 'Failed to load notebooks',
			options: [],
		};
	}
}

export async function getSectionsDropdown(auth: OAuth2PropertyValue) {
	const client = createClient(auth);

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
	const client = createClient(auth);

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
	const client = createClient(auth);

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
	const client = createClient(auth);

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
