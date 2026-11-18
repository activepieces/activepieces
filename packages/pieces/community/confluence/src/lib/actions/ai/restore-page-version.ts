import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceRestorePageVersionOutputSchema } from '../../output-schemas';

export const restorePageVersionAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_restore_page_version',
	outputSchema: confluenceRestorePageVersionOutputSchema,
	displayName: 'Restore Page Version',
	description: 'Restores an earlier version of a page as a new version.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Restores an earlier version of a Confluence page or blog post by publishing its content as a new version; history is kept. Get version numbers from List Page Versions. Not idempotent: each call adds another version.',
		idempotent: false,
	},
	props: {
		pageId: confluenceAiProps.pageId({
			required: true,
			description: 'Numeric ID of the page or blog post, from List Pages or List Blog Posts.',
		}),
		versionNumber: confluenceAiProps.versionNumber({ required: true }),
		message: Property.ShortText({
			displayName: 'Message',
			description: 'Note saved with the new version, e.g. "Reverted to version 3".',
			required: true,
		}),
		restoreTitle: Property.Checkbox({
			displayName: 'Restore Title',
			description: 'Also restore the title from that version.',
			required: false,
		}),
	},
	async run(context) {
		const { pageId, versionNumber, message, restoreTitle } = context.propsValue;
		return await confluenceApi.restoreContentVersion({
			auth: context.auth,
			contentId: pageId,
			versionNumber,
			message,
			restoreTitle,
		});
	},
});
