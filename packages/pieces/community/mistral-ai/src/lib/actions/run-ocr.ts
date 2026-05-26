import { createAction, InputPropertyMap, PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { parseMistralError } from '../common/props';
import { mistralRequest, MistralRequestConfig } from '../common/request';

const OCR_MODEL_OPTIONS = [
	{ label: 'mistral-ocr-latest (Recommended)', value: 'mistral-ocr-latest' },
	{ label: 'mistral-ocr-2505', value: 'mistral-ocr-2505' },
];

export const runOcr = createAction({
	auth: mistralAuth,
	name: 'run_ocr',
	displayName: 'Run OCR',
	description: 'Extract text from PDFs and images using mistral-ocr-latest. To OCR a file from a previous step, run Upload File first (with purpose=ocr) and pass the returned id here.',
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			required: true,
			defaultValue: 'mistral-ocr-latest',
			options: { options: OCR_MODEL_OPTIONS },
		}),
		documentSource: Property.StaticDropdown<DocumentSource>({
			displayName: 'Document Source',
			description: 'Where the document or image to OCR comes from.',
			required: true,
			defaultValue: 'url',
			options: {
				options: [
					{ label: 'URL', value: 'url' },
					{ label: 'Mistral file ID (uploaded earlier with purpose=ocr)', value: 'fileId' },
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
							description: 'A Mistral file ID returned from a prior Upload File step (purpose=ocr).',
							required: true,
						}),
						documentType: documentTypeDropdown(),
					};
					return fields;
				}
				const fields: InputPropertyMap = {
					documentUrl: Property.ShortText({
						displayName: 'URL',
						description: 'Public URL of the PDF or image to OCR.',
						required: true,
					}),
					documentType: documentTypeDropdown(),
				};
				return fields;
			},
		}),
		pages: Property.Array({
			displayName: 'Pages',
			description: 'Optional zero-based page indices to process. Leave empty for all pages.',
			required: false,
		}),
		includeImageBase64: Property.Checkbox({
			displayName: 'Include Image Base64',
			description: 'Return embedded images encoded as base64 alongside the Markdown.',
			required: false,
			defaultValue: false,
		}),
		timeout: Property.Number({
			displayName: 'Timeout (ms)',
			required: false,
			defaultValue: 120000,
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
				throw new Error(parseMistralError(e));
			}
		}
		throw new Error(parseMistralError(lastErr));
	},
});

function documentTypeDropdown() {
	return Property.StaticDropdown<DocumentType>({
		displayName: 'Document Type',
		description: 'Pick "Image" for PNG/JPG/WEBP, "Document" for PDFs.',
		required: true,
		defaultValue: 'document_url',
		options: {
			options: [
				{ label: 'Document (PDF)', value: 'document_url' },
				{ label: 'Image', value: 'image_url' },
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
