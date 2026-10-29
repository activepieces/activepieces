import { createAction, Property } from '@activepieces/pieces-framework';

import { googleDocumentAiAuth } from '../auth';
import { googleDocumentAiApi } from '../common/api';
import { googleDocumentAiProps } from '../common/props';
import { googleDocumentAiUtils } from '../common/utils';
import { processDocumentOutputSchema } from '../output-schemas';

import type { GoogleDocumentAiProcessRequest } from '../common/types';

const sourceOptions: { label: string; value: 'file' | 'gcs' }[] = [
	{ label: 'File (upload or a file from a previous step)', value: 'file' },
	{ label: 'Cloud Storage URI (gs://bucket/object)', value: 'gcs' },
];

export const processDocumentAction = createAction({
	name: 'processDocument',
	classification: 'READ',
	displayName: 'Process Document',
	description:
		'Run a document through a Document AI processor and get its text, entities, form fields and tables',
	audience: 'both',
	aiMetadata: {
		description:
			'Extract text, entities, form fields and tables from one document (a flow file or a gs:// Cloud Storage URI) with a Google Document AI processor of the connected project. Use for OCR, form parsing or invoice/ID extraction; online processing takes up to 15 pages (30 in imageless mode), so pick pages or use Custom API Call batchProcess for longer files. Stores nothing, but each call is billed per page; safe to retry.',
		idempotent: true,
	},
	outputSchema: processDocumentOutputSchema,
	auth: googleDocumentAiAuth,
	props: {
		processor: googleDocumentAiProps.processor({ required: true }),
		processorVersion: Property.ShortText({
			displayName: 'Processor Version',
			description:
				"For example `pretrained-ocr-v2.1-2024-08-07`. Leave empty to use the processor's default version.",
			required: false,
		}),
		source: Property.StaticDropdown<'file' | 'gcs', true>({
			displayName: 'Document Source',
			required: true,
			defaultValue: 'file',
			options: { disabled: false, options: sourceOptions },
		}),
		file: Property.File({
			displayName: 'File',
			description:
				'The document to process. Up to 15 pages, or 30 with Imageless Mode.',
			required: false,
		}),
		gcsUri: Property.ShortText({
			displayName: 'Cloud Storage URI',
			description:
				'For example `gs://bucket/file.pdf`.',
			required: false,
		}),
		mimeType: Property.ShortText({
			displayName: 'MIME Type',
			description: 'Leave empty to detect it from the file extension.',
			required: false,
		}),
		pages: Property.ShortText({
			displayName: 'Pages',
			description:
				'Only process these pages, for example `1,3-5`.',
			required: false,
		}),
		imagelessMode: Property.Checkbox({
			displayName: 'Imageless Mode',
			description:
				'Leave page images out of the result and allow up to 30 pages.',
			required: false,
			defaultValue: true,
		}),
		includeFullDocument: Property.Checkbox({
			displayName: 'Include Full Document',
			description:
				'Also return Google\'s raw `document` output. Can be several MB.',
			required: false,
			defaultValue: false,
		}),
		fieldMask: Property.ShortText({
			displayName: 'Field Mask (Advanced)',
			description:
				'Comma-separated fields to return, for example `text,entities`. Ignored when Include Full Document is on.',
			required: false,
		}),
	},
	async run(context) {
		const {
			processor,
			processorVersion,
			source,
			file,
			gcsUri,
			mimeType,
			pages,
			imagelessMode,
			includeFullDocument,
			fieldMask,
		} = context.propsValue;
		const auth = await googleDocumentAiApi.resolveAuth({ auth: context.auth });
		const name = googleDocumentAiUtils.processorResourceName({
			auth,
			processor,
			version: processorVersion ?? undefined,
		});

		const request: GoogleDocumentAiProcessRequest = {};
		if (source === 'gcs') {
			const uri = String(gcsUri ?? '').trim();
			if (!uri.startsWith('gs://')) {
				throw new Error('Cloud Storage URI must look like gs://bucket/path/file.pdf.');
			}
			request.gcsDocument = {
				gcsUri: uri,
				mimeType: googleDocumentAiUtils.mimeTypeFor({
					explicit: mimeType ?? undefined,
					names: [uri],
				}),
			};
		} else {
			if (!file) {
				throw new Error('Pick a file to process (or switch Document Source to Cloud Storage URI).');
			}
			request.rawDocument = {
				content: file.base64,
				mimeType: googleDocumentAiUtils.mimeTypeFor({
					explicit: mimeType ?? undefined,
					names: [file.filename, file.extension ? `x.${file.extension}` : undefined],
				}),
				...(file.filename ? { displayName: file.filename } : {}),
			};
		}

		const selectedPages = googleDocumentAiUtils.parsePageSelection(pages ?? undefined);
		if (selectedPages)
			request.processOptions = { individualPageSelector: { pages: selectedPages } };
		if (imagelessMode !== false) request.imagelessMode = true;
		if (!includeFullDocument)
			request.fieldMask = googleDocumentAiUtils.effectiveFieldMask({
				fieldMask: fieldMask ?? undefined,
			});

		const response = await googleDocumentAiApi.processDocument({
			auth,
			processorName: name,
			request,
		});
		if (response.document?.error?.message) {
			throw new Error(
				`Document AI could not process the document: ${response.document.error.message}`,
			);
		}
		return {
			processor: name,
			...googleDocumentAiUtils.summarizeDocument({
				document: response.document,
				includeFull: Boolean(includeFullDocument),
				selectedPages,
			}),
			...(response.humanReviewStatus ? { humanReviewStatus: response.humanReviewStatus } : {}),
		};
	},
});
