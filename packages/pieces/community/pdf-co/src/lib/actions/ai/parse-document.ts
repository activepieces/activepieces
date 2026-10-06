import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../../auth';
import { pdfCoClient } from '../../common/client';
import { pdfCoFiles } from '../../common/files';
import { pdfCoJobs } from '../../common/jobs';
import { pdfCoOutputSchemas } from '../../output-schemas';
import { flattenParserResult, parseTemplateId } from '../parse-document';

export const pdfCoParseDocument = createAction({
	auth: pdfCoAuth,
	name: 'pdf_co_parse_document',
	displayName: 'Parse Document (AI)',
	description: 'Extract fields and tables from a PDF with a Document Parser template ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Extracts the fields (as name/value pairs) and tables defined by a PDF.co Document Parser template from a PDF or scan at a public URL; get template IDs from List Document Parser Templates (1 = built-in Invoice Parser). Costs 42 credits per page. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.parseDocument,
	props: {
		source_url: Property.ShortText({ displayName: 'Source URL', description: 'Public http(s) URL of the PDF or image.', required: true }),
		template_id: Property.ShortText({ displayName: 'Template ID', description: 'Numeric Document Parser template ID, e.g. "1".', required: true }),
		pages: Property.ShortText({ displayName: 'Pages', description: 'Optional 0-based pages or ranges, e.g. "0,2-4".', required: false }),
		password: Property.ShortText({ displayName: 'PDF Password', description: 'Optional password if the PDF is protected.', required: false }),
	},
	async run({ auth, propsValue }) {
		const templateId = parseTemplateId(propsValue.template_id);
		pdfCoFiles.validateSource({ url: propsValue.source_url, file: undefined, label: 'source_url' });
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		const body = await pdfCoJobs.runInline({
			apiKey: pdfCoClient.apiKeyOf(auth),
			path: '/v1/pdf/documentparser',
			body: {
				url: propsValue.source_url.trim(),
				templateId,
				inline: true,
				outputFormat: 'JSON',
				...(pages === undefined ? {} : { pages: pages.trim() }),
			},
			common: { pdfPassword: propsValue.password },
		});
		return flattenParserResult(body);
	},
});
