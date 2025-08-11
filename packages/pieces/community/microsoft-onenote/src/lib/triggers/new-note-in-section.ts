import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { getNotebooksDropdown, getSectionsByNotebookDropdown } from '../common';
import { oneNoteAuth } from '../../index';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import dayjs from 'dayjs';

const polling: Polling<OAuth2PropertyValue, { notebook_id: string; section_id: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, store, lastFetchEpochMS }) => {
		const sectionId = propsValue.section_id;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const pages = [];

		const filter =
			lastFetchEpochMS === 0
				? '$top=10'
				: `$filter=createdDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;

		let response: PageCollection = await client
			.api(`/me/onenote/sections/${sectionId}/pages?${filter}`)
			.get();

		if (lastFetchEpochMS === 0) {
			for (const page of response.value) {
				pages.push(page);
			}
		} else {
			while (response.value.length > 0) {
				for (const page of response.value) {
					pages.push(page);
				}

				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
		}

		return pages.map((page) => ({
			epochMilliSeconds: dayjs(page.createdDateTime).valueOf(),
			data: page,
		}));
	},
};

export const newNoteInSectionTrigger = createTrigger({
	name: 'new_note_in_section',
	displayName: 'New Note in Section',
	description: 'Fires when a new note is created in a specified notebook and section.',
	auth: oneNoteAuth,
	props: {
		notebook_id: Property.Dropdown({
			displayName: 'Notebook',
			description: 'The notebook to monitor for new notes.',
			required: true,
			refreshers: ['section_id'],
			options: async ({ auth }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				return await getNotebooksDropdown(auth as OAuth2PropertyValue);
			},
		}),
		section_id: Property.Dropdown({
			displayName: 'Section',
			description: 'The section to monitor for new notes.',
			required: true,
			refreshers: [],
			options: async ({ auth, notebook_id }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				if (!notebook_id) {
					return {
						disabled: true,
						placeholder: 'Select a notebook first',
						options: [],
					};
				}
				return await getSectionsByNotebookDropdown(auth as OAuth2PropertyValue, notebook_id as string);
			},
		}),
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {
		id: 'page-id-example',
		title: 'Sample Page Title',
		createdDateTime: '2025-01-09T01:00:00Z',
		lastModifiedDateTime: '2025-01-09T01:00:00Z',
		createdByAppId: 'app-id-example',
		contentUrl: 'https://graph.microsoft.com/v1.0/me/onenote/pages/page-id-example/content',
		links: {
			oneNoteClientUrl: {
				href: 'onenote:https://example.com/page'
			},
			oneNoteWebUrl: {
				href: 'https://example.com/page'
			}
		},
		level: 0,
		order: 1,
		self: 'https://graph.microsoft.com/v1.0/me/onenote/pages/page-id-example',
		parentSection: {
			id: 'section-id-example',
			displayName: 'Sample Section',
			self: 'https://graph.microsoft.com/v1.0/me/onenote/sections/section-id-example'
		}
	},
});
