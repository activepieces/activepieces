import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { pageMutationActionOutputSchema } from '../output-schemas';

export const updatePageAction = createAction({
	auth: codaAuth,
	name: 'update_page',
	classification: 'WRITE',
	displayName: 'Update Page',
	description: 'Renames, hides or shows a page, and can append, prepend or replace its content.',
	audience: 'both',
	aiMetadata: {
		description: 'Changes a Coda page\'s name, subtitle, icon or hidden state, and can append, prepend or replace its content with Markdown or HTML. Use Replace only when the user wants the page overwritten. Append and Prepend are not idempotent: each call adds the content again.',
		idempotent: false,
	},
	props: {
		docId: codaProps.docId(),
		pageIdOrName: codaProps.pageIdOrName(),
		name: Property.ShortText({
			displayName: 'New Page Name',
			required: false,
		}),
		subtitle: Property.ShortText({
			displayName: 'New Subtitle',
			required: false,
		}),
		iconName: Property.ShortText({
			displayName: 'New Icon Name',
			required: false,
		}),
		visibility: Property.StaticDropdown({
			displayName: 'Visibility',
			description: 'Hiding pages needs a paid Coda plan.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Hide page', value: 'hidden' },
					{ label: 'Show page', value: 'visible' },
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Optional content to add to the page.',
			required: false,
		}),
		insertionMode: Property.StaticDropdown({
			displayName: 'Content Placement',
			description: 'Where the content goes. Replace overwrites everything on the page.',
			required: false,
			defaultValue: 'append',
			options: {
				disabled: false,
				options: [
					{ label: 'Append to the end', value: 'append' },
					{ label: 'Prepend to the start', value: 'prepend' },
					{ label: 'Replace the whole page', value: 'replace' },
				],
			},
		}),
		contentFormat: codaProps.contentFormat(),
		waitForCompletion: codaProps.waitForCompletion(),
	},
	outputSchema: pageMutationActionOutputSchema,
	async run(context) {
		const { docId, pageIdOrName, name, subtitle, iconName, visibility, content, insertionMode, contentFormat, waitForCompletion } =
			context.propsValue;
		const hasContent = content !== undefined && content !== null && content.trim().length > 0;
		const body = {
			...(name?.trim() ? { name: name.trim() } : {}),
			...(subtitle?.trim() ? { subtitle: subtitle.trim() } : {}),
			...(iconName?.trim() ? { iconName: iconName.trim() } : {}),
			...(visibility ? { isHidden: visibility === 'hidden' } : {}),
			...(hasContent
				? {
						contentUpdate: {
							insertionMode: insertionMode ?? 'append',
							canvasContent: { format: contentFormat ?? 'markdown', content },
						},
					}
				: {}),
		};
		if (Object.keys(body).length === 0) {
			throw new Error('Nothing to update: give a new name, subtitle, icon, visibility or some content.');
		}
		const token = context.auth.secret_text;
		const response = await codaApi.request<PageMutationResponse>({
			token,
			method: HttpMethod.PUT,
			path: `${codaApi.docPath(docId)}/pages/${codaApi.pathSegment({ value: pageIdOrName, label: 'Page ID or name' })}`,
			operation: 'update page',
			body,
		});
		const mutation = await codaApi.settleMutation({ token, requestId: response.requestId, waitForCompletion });
		return { id: response.id, ...mutation };
	},
});

type PageMutationResponse = {
	id: string;
	requestId?: string;
};
