import { createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const getPdfFormFields = createAction({
	auth: pdfCoAuth,
	name: 'get_pdf_form_fields',
	displayName: 'Get PDF Form Fields',
	description: 'List the fillable form fields of a PDF with their exact names.',
	audience: 'both',
	classification: 'READ',
	aiMetadata: {
		description:
			'Lists the fillable form fields of a PDF (public URL or file): exact field name, type, page (0-based), current value and position, so Fill PDF Form can target them by name. Costs 8 credits per call. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.formFields,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		...pdfCoProps.inlineRead(),
	},
	async run({ auth, propsValue }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		const body = await pdfCoJobs.runInline({ apiKey, path: '/v1/pdf/info/fields', body: { url }, common: propsValue });
		const info = pdfCoClient.readRecord(body['info']);
		const rawFields = pdfCoClient.readRecord(info['FieldsInfo'])['Fields'];
		const fields = (Array.isArray(rawFields) ? rawFields : []).map((raw) => {
			const field = pdfCoClient.readRecord(raw);
			return {
				field_name: field['FieldName'],
				type: field['Type'],
				value: field['Value'],
				page_index: field['PageIndex'],
				left: field['Left'],
				top: field['Top'],
				width: field['Width'],
				height: field['Height'],
			};
		});
		return {
			page_count: info['PageCount'],
			field_count: fields.length,
			fields,
			credits_used: body['credits'],
			remaining_credits: body['remainingCredits'],
		};
	},
});
