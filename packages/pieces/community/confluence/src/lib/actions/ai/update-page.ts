import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdatePageOutputSchema } from '../../output-schemas';

export const updatePageAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_page',
	outputSchema: confluenceUpdatePageOutputSchema,
	displayName: 'Update Page',
	description: 'Updates the title, body, status or parent of a page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a Confluence page by ID, changing only the title, body, status or parent you set; everything else is kept. It reads the current version and saves the next one, so a concurrent edit between the read and the save is overwritten. Use Update Page Title to rename only, and Move Page to reposition among siblings.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New title. Leave empty to keep the current one.',
			required: false,
		}),
		body: confluenceAiProps.body({
			required: false,
			description:
				'New body in the selected format; replaces the whole body. Leave empty to keep the current one.',
		}),
		bodyFormat: confluenceAiProps.bodyFormat({ required: false }),
		status: confluenceAiProps.contentStatus({
			required: false,
			description: 'Published (current) or draft. Leave empty to keep the current status.',
		}),
		parentId: confluenceAiProps.pageId({
			required: false,
			displayName: 'Parent Page ID',
			description: 'Move the page under this parent page. Leave empty to keep the current parent.',
		}),
		versionMessage: Property.ShortText({
			displayName: 'Version Message',
			description: 'Optional note describing this change.',
			required: false,
		}),
	},
	async run(context) {
		const { pageId, title, body, bodyFormat, status, parentId, versionMessage } =
			context.propsValue;
		if (
			title === undefined &&
			body === undefined &&
			status === undefined &&
			parentId === undefined
		) {
			throw new Error('Set at least one of Title, Body, Status or Parent Page ID.');
		}
		const current = await confluenceApi.getPage({
			auth: context.auth,
			pageId,
			bodyFormat: 'storage',
		});
		return await confluenceApi.updatePage({
			auth: context.auth,
			pageId,
			title: title ?? current.title,
			status: status ?? current.status,
			parentId,
			representation: body === undefined ? 'storage' : bodyFormat ?? 'storage',
			value: body ?? current.body?.storage?.value ?? '',
			versionNumber: current.version.number + 1,
			versionMessage,
		});
	},
});
