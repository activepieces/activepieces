import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';
import { parseTemplateId } from './parse-document';

export const convertHtmlTemplateToPdf = createAction({
	auth: pdfCoAuth,
	name: 'convert_html_template_to_pdf',
	displayName: 'Create PDF from HTML Template',
	description: 'Fill a saved PDF.co HTML template with your data and turn it into a PDF, e.g. an invoice.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Fills a saved PDF.co HTML template (Mustache/Handlebars macros) with JSON data and renders it to a PDF, e.g. invoices or certificates; requires a template ID (see List HTML Templates). Costs 9 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		templateId: pdfCoProps.templateDropdown({ kind: 'html', required: true }),
		templateData: Property.Json({
			displayName: 'Template Data',
			description: 'JSON object with the values for the template macros, e.g. {"invoice_id":"123","paid":true}.',
			required: true,
		}),
		...pdfCoProps.pageLayout(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const templateId = parseTemplateId(propsValue.templateId);
		const data = propsValue.templateData;
		if (typeof data !== 'object' || data === null) {
			throw new Error('Template Data must be a JSON object.');
		}
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/convert/from/html',
			body: { templateId, templateData: JSON.stringify(data), ...pdfCoProps.pageLayoutBody(propsValue) },
			common: propsValue,
		});
	},
});
