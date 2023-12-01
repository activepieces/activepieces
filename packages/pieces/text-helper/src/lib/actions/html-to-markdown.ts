import { Property, createAction } from '@activepieces/pieces-framework';
import { Converter } from 'showdown';
import { JSDOM } from 'jsdom';

export const htmlToMarkdown = createAction({
	name        : 'htmlToMarkdown',
	displayName : 'HTML to Markdown',
	description : 'Convert HTML to Markdown',
	props       : {
		html: Property.LongText({
			displayName : 'HTML Content',
			description : 'The HTML to convert to markdown',
			required    : true,
		}),
	},
	run: async (context) => {
		const html      = context.propsValue.html;
		const doc       = new JSDOM(html);
		const converter = new Converter();
	    return converter.makeMarkdown(html, doc.window.document);
	},
});
