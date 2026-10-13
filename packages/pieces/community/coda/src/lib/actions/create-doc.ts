import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { createDocActionOutputSchema } from '../output-schemas';

export const createDocAction = createAction({
	auth: codaAuth,
	name: 'create_doc',
	classification: 'WRITE',
	displayName: 'Create Doc',
	description: 'Creates a new doc, either blank (optionally with a first page) or as a copy of an existing doc.',
	audience: 'both',
	aiMetadata: {
		description: 'Creates a new Coda doc, blank with an optional first page of Markdown/HTML, or as a full copy of a source doc (tables, formulas and buttons included). Use a copy when a template doc already has the tables you need, since tables cannot be created through the API. Requires the Doc Maker role. Not idempotent: each call creates another doc.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
		}),
		sourceDoc: Property.ShortText({
			displayName: 'Copy From Doc (ID or Link)',
			description: 'Optional. The doc to copy. Leave empty to create a blank doc.',
			required: false,
		}),
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: 'Optional folder for the new doc (starts with "fl-"). Defaults to your "My docs" folder. Use List Folders to find it.',
			required: false,
		}),
		timezone: Property.ShortText({
			displayName: 'Time Zone',
			description: 'Optional, for example America/New_York.',
			required: false,
		}),
		pageName: Property.ShortText({
			displayName: 'First Page Name',
			description: 'Optional. Only used for a blank doc.',
			required: false,
		}),
		pageContent: Property.LongText({
			displayName: 'First Page Content',
			description: 'Optional. Only used for a blank doc.',
			required: false,
		}),
		contentFormat: codaProps.contentFormat(),
		waitForCompletion: codaProps.waitForCompletion(),
	},
	outputSchema: createDocActionOutputSchema,
	async run(context) {
		const { title, sourceDoc, folderId, timezone, pageName, pageContent, contentFormat, waitForCompletion } = context.propsValue;
		if (!title || title.trim().length === 0) {
			throw new Error('Title is required.');
		}
		const copyFrom = sourceDoc && sourceDoc.trim().length > 0 ? codaApi.parseDocId(sourceDoc) : undefined;
		if (copyFrom && (pageName?.trim() || pageContent?.trim())) {
			throw new Error('First Page Name and First Page Content only apply to a blank doc. Leave them empty when copying a doc.');
		}
		const initialPage =
			!copyFrom && (pageName?.trim() || pageContent?.trim())
				? {
						name: pageName?.trim() || title.trim(),
						...(pageContent?.trim()
							? { pageContent: { type: 'canvas', canvasContent: { format: contentFormat ?? 'markdown', content: pageContent } } }
							: {}),
					}
				: undefined;
		const token = context.auth.secret_text;
		const doc = await codaApi.request<CreatedDoc>({
			token,
			method: HttpMethod.POST,
			path: '/docs',
			operation: 'create doc',
			body: {
				title: title.trim(),
				...(copyFrom ? { sourceDoc: copyFrom } : {}),
				...(folderId?.trim() ? { folderId: folderId.trim() } : {}),
				...(timezone?.trim() ? { timezone: timezone.trim() } : {}),
				...(initialPage ? { initialPage } : {}),
			},
		});
		const mutation = doc.requestId
			? await codaApi.settleMutation({ token, requestId: doc.requestId, waitForCompletion })
			: { requestId: null, completed: true, warning: null };
		return { ...doc, ...mutation };
	},
});

type CreatedDoc = {
	id: string;
	requestId?: string;
	[key: string]: unknown;
};
