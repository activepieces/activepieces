import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { publishDraftOutputSchema } from '../output-schemas';

export const publishDraftAction = createAction({
	auth: confluenceAuth,
	name: 'publish-draft',
	outputSchema: publishDraftOutputSchema,
	classification: 'WRITE',
	displayName: 'Publish Draft',
	description: 'Publishes a draft page (changes status from draft to current).',
	audience: 'both',
	aiMetadata: { description: 'Publishes an existing draft Confluence page by ID, flipping its status from draft to current while preserving its title and body. Use to make a previously created draft live. Requires the draft page ID. Effectively idempotent once published — re-running on an already-current page leaves it published.', idempotent: true },
	props: {
		pageId: Property.ShortText({
			displayName: 'Draft Page ID',
			description: 'ID of the draft page to publish.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId } = context.propsValue;

		const draft = await confluenceApi.getPage({
			auth: context.auth,
			pageId,
			bodyFormat: 'storage',
			getDraft: true,
		});

		return await confluenceApi.updatePage({
			auth: context.auth,
			pageId,
			status: 'current',
			title: draft.title,
			representation: draft.body?.storage?.representation ?? 'storage',
			value: draft.body?.storage?.value ?? '',
			versionNumber: 1,
		});
	},
});
