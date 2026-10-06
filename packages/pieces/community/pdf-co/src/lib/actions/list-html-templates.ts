import { createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const listHtmlTemplates = createAction({
	auth: pdfCoAuth,
	name: 'list_html_templates',
	displayName: 'List HTML Templates',
	description: 'List the HTML-to-PDF templates on your PDF.co account.',
	audience: 'both',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every HTML-to-PDF template (built-in system ones and your own) with ID, title, type and sample JSON data. Use to find the template ID for Create PDF from HTML Template. Costs 2 credits per call. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.htmlTemplates,
	props: {},
	async run({ auth }) {
		const list = await pdfCoProps.listTemplates({ apiKey: pdfCoClient.apiKeyOf(auth), kind: 'html' });
		return { template_count: list.templates.length, ...list };
	},
});
