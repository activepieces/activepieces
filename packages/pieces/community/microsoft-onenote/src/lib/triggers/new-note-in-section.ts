import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';
import dayjs from 'dayjs';
import { microsoftOneNoteAuth } from '../auth';
import { microsoftOneNoteClient } from '../common/client';
import { microsoftOneNoteProps } from '../common/props';
import type { MicrosoftOneNoteList, OnenotePage } from '../common/types';
import { newNoteInSectionOutputSchema } from '../output-schemas';

async function fetchPageContent({ client, pageId }: { client: Client; pageId: string | undefined }): Promise<string | null> {
	try {
		return await client
			.api(`/me/onenote/pages/${pageId}/content`)
			.responseType(ResponseType.TEXT)
			.get();
	} catch {
		return null;
	}
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftOneNoteAuth>, { notebook_id: string; section_id: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const sectionId = propsValue.section_id;
		const client = microsoftOneNoteClient.create({ auth });

		try {
			const pages: OnenotePage[] = [];

			let queryParams: string;
			if (lastFetchEpochMS === 0) {
				queryParams = '$top=10&$orderby=createdDateTime desc';
			} else {
				const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();
				queryParams = `$filter=createdDateTime gt ${lastFetchDate}&$orderby=createdDateTime desc`;
			}

			let response: MicrosoftOneNoteList<OnenotePage> = await client
				.api(`/me/onenote/sections/${sectionId}/pages?${queryParams}`)
				.get();

			while (response.value.length > 0) {
				for (const page of response.value) {
					pages.push(page);
				}

				if (lastFetchEpochMS !== 0 && response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}

			const pagesWithContent = await Promise.all(
				pages.map(async (page) => ({
					...page,
					content: await fetchPageContent({ client, pageId: page.id }),
				})),
			);

			return pagesWithContent.map((page) => ({
				epochMilliSeconds: dayjs(page.createdDateTime).valueOf(),
				data: page,
			}));
		} catch (error) {
			throw new Error(`Failed to fetch new notes: ${(error instanceof Error && error.message) || 'Unknown error'}`);
		}
	},
};

export const newNoteInSectionTrigger = createTrigger({
	name: 'new_note_in_section',
	outputSchema: newNoteInSectionOutputSchema,
	classification: 'READ',
	displayName: 'New Note in Section',
	description: 'Fires when a new note is created in a specified section.',
	aiMetadata: {
		description: 'Fires when a new page (note) is created in a specific OneNote notebook section, detected by polling for pages newer than the last check ordered by creation time. Each event represents one newly created page.',
	},
	auth: microsoftOneNoteAuth,
	props: {
		notebook_id: microsoftOneNoteProps.notebookId({
			required: true,
			description: 'The notebook to monitor for new notes.',
		}),
		section_id: microsoftOneNoteProps.sectionId({
			required: true,
			description: 'The section to monitor for new notes.',
		}),
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
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
		content: '<html><head><title>Sample Page Title</title></head><body><p>Sample note content.</p></body></html>',
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
