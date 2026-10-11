import { createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const listDocumentParserTemplates = createAction({
	auth: pdfCoAuth,
	name: 'list_document_parser_templates',
	displayName: 'List Document Parser Templates',
	description: 'List the Document Parser templates on your PDF.co account.',
	audience: 'both',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every Document Parser template (built-in system ones such as "Invoice Parser" and your own) with ID, title, type and description. Use to find the template ID for Parse Document with Template. Costs 2 credits per call. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.templates,
	props: {},
	async run({ auth }) {
		const list = await pdfCoProps.listTemplates({ apiKey: pdfCoClient.apiKeyOf(auth), kind: 'documentParser' });
		return {
			template_count: list.templates.length,
			templates: list.templates.map(({ id, title, type, description }) => ({ id, title, type, description })),
			credits_used: list.credits_used,
			remaining_credits: list.remaining_credits,
		};
	},
});
