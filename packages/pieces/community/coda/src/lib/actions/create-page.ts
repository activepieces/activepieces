import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { pageMutationActionOutputSchema } from '../output-schemas';

export const createPageAction = createAction({
	auth: codaAuth,
	name: 'create_page',
	classification: 'WRITE',
	displayName: 'Create Page',
	description: 'Adds a new page to a doc, optionally under a parent page and with Markdown or HTML content.',
	audience: 'both',
	aiMetadata: {
		description: 'Adds a new page (or subpage, with Parent Page ID) to a Coda doc, optionally filled with Markdown or HTML, and by default waits until Coda has created it. Use Update Page to change an existing page. Requires the Doc Maker role. Not idempotent: each call adds another page.',
		idempotent: false,
	},
	props: {
		docId: codaProps.docId(),
		name: Property.ShortText({
			displayName: 'Page Name',
			required: true,
		}),
		subtitle: Property.ShortText({
			displayName: 'Subtitle',
			required: false,
		}),
		iconName: Property.ShortText({
			displayName: 'Icon Name',
			description: 'A Coda icon name, for example "rocket".',
			required: false,
		}),
		parentPageId: Property.ShortText({
			displayName: 'Parent Page ID',
			description: 'Optional. Creates the page as a subpage of this page.',
			required: false,
		}),
		content: Property.LongText({
			displayName: 'Content',
			required: false,
		}),
		contentFormat: codaProps.contentFormat(),
		waitForCompletion: codaProps.waitForCompletion(),
	},
	outputSchema: pageMutationActionOutputSchema,
	async run(context) {
		const { docId, name, subtitle, iconName, parentPageId, content, contentFormat, waitForCompletion } = context.propsValue;
		if (!name || name.trim().length === 0) {
			throw new Error('Page Name is required.');
		}
		const token = context.auth.secret_text;
		const response = await codaApi.request<PageMutationResponse>({
			token,
			method: HttpMethod.POST,
			path: `${codaApi.docPath(docId)}/pages`,
			operation: 'create page',
			body: {
				name: name.trim(),
				...(subtitle?.trim() ? { subtitle: subtitle.trim() } : {}),
				...(iconName?.trim() ? { iconName: iconName.trim() } : {}),
				...(parentPageId?.trim() ? { parentPageId: parentPageId.trim() } : {}),
				...(content && content.trim().length > 0
					? { pageContent: { type: 'canvas', canvasContent: { format: contentFormat ?? 'markdown', content } } }
					: {}),
			},
		});
		const mutation = await codaApi.settleMutation({ token, requestId: response.requestId, waitForCompletion });
		return { id: response.id, ...mutation };
	},
});

type PageMutationResponse = {
	id: string;
	requestId?: string;
};
