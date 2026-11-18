import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const fillPdfForm = createAction({
	auth: pdfCoAuth,
	name: 'fill_pdf_form',
	displayName: 'Fill PDF Form',
	description: 'Fill the form fields of a fillable PDF by field name.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Fills existing form fields of a fillable PDF (public URL or file) by exact field name, optionally flattening the result so it can no longer be edited. Get the exact names from Get PDF Form Fields; checkboxes take "true". Costs 21 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'One entry per form field. Use Get PDF Form Fields to see the exact names.',
			required: true,
			properties: {
				fieldName: Property.ShortText({ displayName: 'Field Name', description: 'Exact form field name.', required: true }),
				text: Property.ShortText({
					displayName: 'Value',
					description: 'Text to enter. For a checkbox use "true"; for a list or radio button use the option value.',
					required: true,
				}),
				pages: Property.ShortText({ displayName: 'Page', description: 'Page of the field (first page is 0). Optional.', required: false }),
			},
		}),
		flatten: Property.Checkbox({
			displayName: 'Flatten Form',
			description: 'Make the filled form read-only so values can no longer be changed.',
			required: false,
			defaultValue: false,
		}),
		...pdfCoProps.password(),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const fields = toFormFields(propsValue.fields);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/edit/add',
			body: {
				url,
				fields,
				...(propsValue.flatten === true ? { profiles: JSON.stringify({ 'FlattenDocument()': [] }) } : {}),
			},
			common: propsValue,
		});
	},
});

export function toFormFields(value: unknown): FormField[] {
	const items = Array.isArray(value) ? value : [];
	if (items.length === 0) {
		throw new Error('Add at least one field to fill.');
	}
	return items.map((item, index) => {
		const record = pdfCoClient.readRecord(item);
		const fieldName = typeof record['fieldName'] === 'string' ? record['fieldName'].trim() : '';
		if (fieldName === '') {
			throw new Error(`Field #${index + 1} needs a field name.`);
		}
		const rawText = record['text'];
		const text = rawText === undefined || rawText === null ? '' : String(rawText);
		const pages = record['pages'] === undefined || record['pages'] === null ? '' : String(record['pages']).trim();
		return { fieldName, text, ...(pages === '' ? {} : { pages }) };
	});
}

export type FormField = { fieldName: string; text: string; pages?: string };
