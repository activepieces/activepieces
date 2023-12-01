import { Property, createAction } from '@activepieces/pieces-framework';
import { Converter } from 'showdown';

export const markdownToHTML = createAction({
	name        : 'markdownToHTML',
	displayName : 'Markdown to HTML',
	description : 'Convert markdown to HTML',
	props       : {
		markdown: Property.LongText({
			displayName : 'Markdown Content',
			description : 'The markdown to convert to HTML',
			required    : true,
		}),
	},
	run: async (context) => {
		const converter = new Converter();
	    return converter.makeHtml(context.propsValue.markdown);
	},
});
