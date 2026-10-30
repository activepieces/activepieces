import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { pageExport } from '../common/page-export';
import { getPageContentActionOutputSchema } from '../output-schemas';

export const getPageContentAction = createAction({
	auth: codaAuth,
	name: 'get_page_content',
	classification: 'READ',
	displayName: 'Get Page Content',
	description: 'Exports a page\'s content as Markdown or HTML text.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns the text of a Coda page as Markdown (or HTML), capped at 5 MB. Use to read or summarise a page; use Get Page for its metadata only. If Coda needs more than a minute, it returns Completed = false and an Export ID to pass back in a second call. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		pageIdOrName: codaProps.pageIdOrName(),
		outputFormat: Property.StaticDropdown({
			displayName: 'Format',
			required: true,
			defaultValue: 'markdown',
			options: {
				disabled: false,
				options: [
					{ label: 'Markdown', value: 'markdown' },
					{ label: 'HTML', value: 'html' },
				],
			},
		}),
		exportId: Property.ShortText({
			displayName: 'Export ID',
			description: 'Leave empty. Only fill it to resume an export that returned Completed = false earlier.',
			required: false,
		}),
	},
	outputSchema: getPageContentActionOutputSchema,
	async run(context) {
		const { docId, pageIdOrName, outputFormat, exportId } = context.propsValue;
		const format = outputFormat === 'html' ? 'html' : 'markdown';
		const token = context.auth.secret_text;
		const pagePath = `${codaApi.docPath(docId)}/pages/${codaApi.pathSegment({ value: pageIdOrName, label: 'Page ID or name' })}`;
		const id = exportId?.trim() || (await pageExport.startExport({ token, pagePath, format })).id;
		const status = await pageExport.waitForExport({ token, pagePath, exportId: id });
		if (!status) {
			return { pageId: pageIdOrName, format, completed: false, exportId: id, content: null, truncated: false };
		}
		if (!status.downloadLink) {
			throw new Error('Coda finished the export but returned no download link.');
		}
		const { content, truncated } = await pageExport.downloadText({ url: status.downloadLink, format });
		return { pageId: pageIdOrName, format, completed: true, exportId: id, content, truncated };
	},
});
