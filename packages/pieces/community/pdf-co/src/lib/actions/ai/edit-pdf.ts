import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../../auth';
import { pdfCoClient } from '../../common/client';
import { pdfCoFiles } from '../../common/files';
import { pdfCoJobs } from '../../common/jobs';
import { pdfCoOutputSchemas } from '../../output-schemas';
import { toFormFields } from '../fill-pdf-form';

const ANNOTATION_KEYS = ['text', 'x', 'y', 'pages', 'size', 'fontName', 'color', 'link', 'width', 'height', 'fontBold', 'fontItalic', 'fontUnderline', 'fontStrikeout', 'alignment', 'transparent', 'RotationAngle'];
const IMAGE_KEYS = ['url', 'x', 'y', 'pages', 'width', 'height', 'link', 'keepAspectRatio'];
const MAX_ITEMS = 100;

export const pdfCoEditPdf = createAction({
	auth: pdfCoAuth,
	name: 'pdf_co_edit_pdf',
	displayName: 'Edit PDF (AI)',
	description: 'Add texts, images and form-field values to a PDF in one call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds any mix of text annotations, images and form-field values to a PDF at a public URL in one pass and returns a temporary link to the new PDF. Coordinates are points from the top-left corner; pages are 0-based. Costs 21 credits per page. Not idempotent: each call creates a new output and consumes credits.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		source_url: Property.ShortText({ displayName: 'Source URL', description: 'Public http(s) URL of the PDF.', required: true }),
		annotations: Property.Json({
			displayName: 'Text Annotations',
			description: 'Optional JSON array of {text, x, y, pages?, size?, fontName?, color?, fontBold?, alignment?, width?, height?}.',
			required: false,
		}),
		images: Property.Json({
			displayName: 'Images',
			description: 'Optional JSON array of {url, x, y, pages?, width?, height?, link?, keepAspectRatio?}; url must be a public image link.',
			required: false,
		}),
		fields: Property.Json({
			displayName: 'Form Fields',
			description: 'Optional JSON array of {fieldName, text, pages?} to fill existing form fields by exact name.',
			required: false,
		}),
		password: Property.ShortText({ displayName: 'PDF Password', description: 'Optional password if the PDF is protected.', required: false }),
		output_name: Property.ShortText({ displayName: 'Output Name', description: 'Optional name for the result file.', required: false }),
	},
	async run({ auth, propsValue, files }) {
		pdfCoFiles.validateSource({ url: propsValue.source_url, file: undefined, label: 'source_url' });
		const annotations = toItems({ value: propsValue.annotations, label: 'annotations', keys: ANNOTATION_KEYS, required: ['text', 'x', 'y'] });
		const images = toItems({ value: propsValue.images, label: 'images', keys: IMAGE_KEYS, required: ['url', 'x', 'y'] });
		images.forEach((image, index) =>
			pdfCoFiles.validateSource({ url: image['url'], file: undefined, label: `images[${index}].url` }),
		);
		const fields = isEmpty(propsValue.fields) ? [] : toFormFields(toArray({ value: propsValue.fields, label: 'fields' }));
		if (annotations.length + images.length + fields.length === 0) {
			throw new Error('Give at least one item in annotations, images or fields.');
		}
		return pdfCoJobs.runFileAction({
			apiKey: pdfCoClient.apiKeyOf(auth),
			files,
			path: '/v1/pdf/edit/add',
			body: {
				url: propsValue.source_url.trim(),
				inline: false,
				...(annotations.length === 0 ? {} : { annotations }),
				...(images.length === 0 ? {} : { images }),
				...(fields.length === 0 ? {} : { fields }),
			},
			common: { pdfPassword: propsValue.password, outputName: propsValue.output_name, saveOutputFile: false, runInBackground: false },
		});
	},
});

function isEmpty(value: unknown): boolean {
	return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function toArray({ value, label }: { value: unknown; label: string }): unknown[] {
	const parsed = typeof value === 'string' ? parseJson({ text: value, label }) : value;
	if (!Array.isArray(parsed)) {
		throw new Error(`${label} must be a JSON array.`);
	}
	if (parsed.length > MAX_ITEMS) {
		throw new Error(`${label} can have at most ${MAX_ITEMS} items.`);
	}
	return parsed;
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`${label} is not valid JSON.`);
	}
}

function toItems({
	value,
	label,
	keys,
	required,
}: {
	value: unknown;
	label: string;
	keys: string[];
	required: string[];
}): Record<string, unknown>[] {
	if (isEmpty(value)) {
		return [];
	}
	const allowed = new Set(keys);
	return toArray({ value, label }).map((item, index) => {
		const record = pdfCoClient.readRecord(item);
		const unknownKeys = Object.keys(record).filter((key) => !allowed.has(key));
		if (unknownKeys.length > 0) {
			throw new Error(`${label}[${index}] has unknown keys: ${unknownKeys.join(', ')}.`);
		}
		const missing = required.filter((key) => record[key] === undefined || record[key] === null || record[key] === '');
		if (missing.length > 0) {
			throw new Error(`${label}[${index}] is missing: ${missing.join(', ')}.`);
		}
		['x', 'y', 'width', 'height', 'size'].forEach((key) => {
			if (record[key] !== undefined && !Number.isFinite(Number(record[key]))) {
				throw new Error(`${label}[${index}].${key} must be a number.`);
			}
		});
		return Object.fromEntries(
			Object.entries(record).map(([key, entry]) =>
				['x', 'y', 'width', 'height', 'size'].includes(key) ? [key, Number(entry)] : key === 'pages' ? [key, String(entry)] : [key, entry],
			),
		);
	});
}
