import { createAction, InputPropertyMap, PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { parseMistralError } from '../common/props';
import { mistralRequest, MistralRequestConfig } from '../common/request';

const OCR_MODEL_OPTIONS = [
	{ label: 'Latest', value: 'mistral-ocr-latest', icon: 'sliders' },
	{ label: 'Version 2505', value: 'mistral-ocr-2505', icon: 'sliders' },
];

export const runOcr = createAction({
  audience: 'both',
	auth: mistralAuth,
	name: 'run_ocr',
	classification: 'READ',
	displayName: 'Run OCR',
	description: 'Extract the text of a PDF or image as Markdown.',
	propertyGroups: [
		{ key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['model'] },
		{ key: 'document', display: 'section', label: 'Document', icon: 'file', props: ['documentSource', 'sourceFields', 'pages'] },
	],
	aiMetadata: { description: 'Extracts the text of a PDF or image as Markdown with a Mistral OCR model, taking the document either from a public URL or from a Mistral file id (that mode first resolves a short-lived signed URL); optional zero-based page indices narrow the run and embedded images can come back as base64. Pick this to read text out of a document that already exists, and Ask Mistral when the answer has to be generated or reasoned about rather than transcribed. The file-id mode only works for a file that Upload File stored with purpose=ocr, and the document type must be set to PDF or image to match the source. Read-only extraction that stores nothing, so repeat calls are idempotent.', idempotent: true },
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			description: 'Latest is recommended. Version 2505 never changes.',
			required: true,
			defaultValue: 'mistral-ocr-latest',
			display: 'cards',
			options: { options: OCR_MODEL_OPTIONS },
		}),
		documentSource: Property.StaticDropdown<DocumentSource>({
			displayName: 'Document Source',
			description: 'Where the PDF or image to read comes from.',
			required: true,
			defaultValue: 'url',
			display: 'cards',
			options: {
				options: [
					{ label: 'Public URL', value: 'url', icon: 'file' },
					{ label: 'Mistral File ID', value: 'fileId', icon: 'paperclip' },
				],
			},
		}),
		sourceFields: Property.DynamicProperties({
			displayName: 'Document',
			required: true,
			refreshers: ['documentSource'],
			auth: PieceAuth.None(),
			props: async (propsValue) => {
				const source = propsValue['documentSource'] as unknown as DocumentSource;
				if (source === 'fileId') {
					const fields: InputPropertyMap = {
						fileId: Property.ShortText({
							displayName: 'File ID',
							description: 'The ID from an Upload File step with purpose OCR.',
							placeholder: 'e.g. 00edaf84-95b0-45db-8f83-f71138491f23',
							required: true,
						}),
						documentType: documentTypeDropdown(),
					};
					return fields;
				}
				const fields: InputPropertyMap = {
					documentUrl: Property.ShortText({
						displayName: 'URL',
						description: 'A public link to the PDF or image.',
						placeholder: 'https://example.com/invoice.pdf',
						required: true,
					}),
					documentType: documentTypeDropdown(),
				};
				return fields;
			},
		}),
		pages: Property.Array({
			displayName: 'Pages',
			description: 'Page numbers to read, starting at 0. Empty: every page.',
			required: false,
		}),
		includeImageBase64: Property.Checkbox({
			displayName: 'Include Images',
			description: 'Also return the images found in the document, as base64.',
			required: false,
			defaultValue: false,
			advanced: true,
		}),
		timeout: Property.Number({
			displayName: 'Timeout',
			description: 'Milliseconds to wait for a response. Empty: 2 minutes.',
			required: false,
			defaultValue: 120000,
			advanced: true,
		}),
	},
	async run(context) {
		const { model, documentSource, sourceFields, pages, includeImageBase64, timeout } = context.propsValue;
		const config = mistralRequest.getConfig(context.auth);

		const document = await resolveDocument({
			source: documentSource as DocumentSource,
			fields: sourceFields as DynamicSourceFields,
			config,
			timeout: timeout ?? 120000,
		});

		const body: Record<string, unknown> = {
			model,
			document,
		};
		const pageIndices = parsePageIndices(pages as unknown);
		if (pageIndices) {
			body['pages'] = pageIndices;
		}
		if (includeImageBase64) {
			body['include_image_base64'] = true;
		}

		let lastErr;
		for (let attempt = 0; attempt <= 3; ++attempt) {
			try {
				const response = await httpClient.sendRequest<OcrResponse>({
					method: HttpMethod.POST,
					url: `${config.baseUrl}/ocr`,
					headers: {
						...config.headers,
						'Content-Type': 'application/json',
					},
					body,
					timeout: timeout ?? 120000,
				});
				const markdown = (response.body.pages ?? []).map((p) => p.markdown ?? '').join('\n\n');
				return {
					...response.body,
					markdown,
				};
			} catch (e: any) {
				lastErr = e;
				const status = e.response?.status;
				if (status === 429 || (status && status >= 500 && status < 600)) {
					if (attempt < 3) {
						await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
						continue;
					}
				}
				throw new Error(parseMistralError({ error: e, baseUrl: config.baseUrl }));
			}
		}
		throw new Error(parseMistralError({ error: lastErr, baseUrl: config.baseUrl }));
	},
});

function documentTypeDropdown() {
	return Property.StaticDropdown<DocumentType>({
		displayName: 'Document Type',
		description: 'Pick Image for PNG, JPG or WEBP, Document for PDFs.',
		required: true,
		defaultValue: 'document_url',
		display: 'cards',
		options: {
			options: [
				{ label: 'Document', value: 'document_url', icon: 'file' },
				{ label: 'Image', value: 'image_url', icon: 'file' },
			],
		},
	});
}

async function resolveDocument({
	source,
	fields,
	config,
	timeout,
}: {
	source: DocumentSource;
	fields: DynamicSourceFields;
	config: MistralRequestConfig;
	timeout: number;
}): Promise<OcrDocument> {
	const documentType = (fields['documentType'] as DocumentType | undefined) ?? 'document_url';
	if (source === 'fileId') {
		const fileId = (fields['fileId'] as string | undefined)?.trim();
		if (!fileId) {
			throw new Error('A Mistral file ID is required.');
		}
		const signedUrl = await fetchSignedUrl({ fileId, config, timeout });
		return buildUrlDocument({ documentType, url: signedUrl });
	}
	const documentUrl = (fields['documentUrl'] as string | undefined)?.trim();
	if (!documentUrl) {
		throw new Error('A document URL is required.');
	}
	return buildUrlDocument({ documentType, url: documentUrl });
}

function buildUrlDocument({ documentType, url }: { documentType: DocumentType; url: string }): OcrDocument {
	if (documentType === 'image_url') {
		return { type: 'image_url', image_url: url };
	}
	return { type: 'document_url', document_url: url };
}

async function fetchSignedUrl({ fileId, config, timeout }: { fileId: string; config: MistralRequestConfig; timeout: number }): Promise<string> {
	const response = await httpClient.sendRequest<{ url: string }>({
		method: HttpMethod.GET,
		url: `${config.baseUrl}/files/${encodeURIComponent(fileId)}/url?expiry=24`,
		headers: config.headers,
		timeout,
	});
	if (!response.body.url) {
		throw new Error(`Could not fetch a signed URL for file ${fileId}.`);
	}
	return response.body.url;
}

function parsePageIndices(raw: unknown): number[] | null {
	if (!Array.isArray(raw) || raw.length === 0) {
		return null;
	}
	const indices = raw
		.map((entry) => {
			if (typeof entry === 'number') return entry;
			const parsed = Number(String(entry).trim());
			return Number.isFinite(parsed) ? parsed : null;
		})
		.filter((entry): entry is number => entry !== null && Number.isInteger(entry) && entry >= 0);
	return indices.length > 0 ? indices : null;
}

type DocumentSource = 'url' | 'fileId';

type DocumentType = 'document_url' | 'image_url';

type DynamicSourceFields = Record<string, unknown>;

type OcrDocument =
	| { type: 'document_url'; document_url: string }
	| { type: 'image_url'; image_url: string };

type OcrPage = {
	index?: number;
	markdown?: string;
	images?: unknown[];
	dimensions?: Record<string, number>;
};

type OcrResponse = {
	pages?: OcrPage[];
	model?: string;
	usage_info?: Record<string, unknown>;
};
