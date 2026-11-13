import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	addBarcodeToPdf,
	addImageToPdf,
	addPasswordToPdf,
	convertDocumentToPdf,
	convertHtmlToPdf,
	convertPdfToImage,
	convertPdfToStructuredFormat,
	deletePdfPages,
	extractTablesFromPdf,
	extractTextFromPdf,
	fillPdfForm,
	findTextInPdf,
	getCreditBalance,
	getPdfFormFields,
	getPdfInfo,
	mergePdfs,
	parseInvoiceWithAi,
	readBarcodes,
	rotatePdfPages,
	searchAndReplaceText,
	splitPdf,
	uploadFile,
} from '../src/lib/actions';
import { pdfCo } from '../src';
import { binaryResponse, installFetch, jsonResponse, okFileResult, requestOf, runAction, STORAGE_URL } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
	fetchMock = installFetch();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('piece metadata', () => {
	it('every action has audience, classification, aiMetadata and outputSchema', () => {
		const actions = Object.values(pdfCo.actions());
		expect(actions.length).toBe(37);
		for (const action of actions) {
			expect(['both', 'human', 'ai']).toContain(action.audience);
			expect(action.classification).toBeDefined();
			expect(action.aiMetadata?.description.length).toBeGreaterThan(40);
			expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
		}
	});

	it('keeps all 8 original action names', () => {
		const names = Object.keys(pdfCo.actions());
		for (const name of [
			'add_barcode_to_pdf',
			'add_image_to_pdf',
			'add_text_to_pdf',
			'convert_html_to_pdf',
			'convert_pdf_to_structured_format',
			'extract_tables_from_pdf',
			'extract_text_from_pdf',
			'search_and_replace_text',
		]) {
			expect(names).toContain(name);
		}
	});
});

describe('existing actions keep their output', () => {
	it('Add Image keeps outputUrl/pageCount/outputName and does not download by default', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }));
		const result = await runAction({
			action: addImageToPdf,
			propsValue: { url: 'https://a.example/a.pdf', imageUrl: 'https://a.example/logo.png', xCoordinate: 10, yCoordinate: 20 },
		});
		expect(result).toEqual({ outputUrl: STORAGE_URL, pageCount: 2, outputName: 'result.pdf', creditsUsed: 4, remainingCredits: 9000 });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({
			url: 'https://a.example/a.pdf',
			images: [{ url: 'https://a.example/logo.png', x: 10, y: 20 }],
			async: false,
			inline: false,
		});
	});

	it('Add Barcode returns the raw body plus a saved file when asked', async () => {
		const written: { fileName: string; size: number }[] = [];
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { url: 'https://pdf-temp-files.s3.amazonaws.com/b/barcode.png', error: false } }))
			.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }))
			.mockResolvedValueOnce(binaryResponse({ data: Buffer.from('pdf') }));
		const result = await runAction({
			action: addBarcodeToPdf,
			propsValue: { sourcePdfUrl: 'https://a.example/a.pdf', barcodeValue: 'X1', barcodeType: 'QRCode', x: 1, y: 2, saveOutputFile: true, fileName: 'b.pdf' },
			written,
		});
		expect(result).toMatchObject({ ...okFileResult(), file: 'https://files.example/b.pdf' });
		expect(requestOf({ fetchMock, call: 0 })).toMatchObject({ url: 'https://api.pdf.co/v1/barcode/generate', body: { value: 'X1', type: 'QRCode' } });
		expect(written).toEqual([{ fileName: 'b.pdf', size: 3 }]);
	});

	it('Convert HTML uses Custom Paper Size over the dropdown', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }));
		await runAction({ action: convertHtmlToPdf, propsValue: { html: '<p>x</p>', paperSize: 'A4', customPaperSize: ' 200mm 300mm ' } });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ html: '<p>x</p>', paperSize: '200mm 300mm', async: false });
	});

	it('Convert PDF to structured format supports the new XLSX value', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: okFileResult({ name: 'sample.xlsx' }) }));
		const result = await runAction({ action: convertPdfToStructuredFormat, propsValue: { url: 'https://a.example/a.pdf', outputFormat: 'xlsx' } });
		expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.pdf.co/v1/pdf/convert/to/xlsx');
		expect(result).toMatchObject({ name: 'sample.xlsx', url: STORAGE_URL });
	});

	it('Extract Tables returns an empty list instead of crashing when there are no objects (B9)', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { error: false, status: 200, pageCount: 1 } }));
		const result = await runAction({ action: extractTablesFromPdf, propsValue: { url: 'https://a.example/a.pdf', templateId: '1' } });
		expect(result).toEqual({ extractedTables: [], templateNameUsed: undefined });
	});

	it('Extract Text keeps text-simple by default and switches to OCR text when asked', async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { body: 'hello', pageCount: 1, name: 'a.txt', credits: 4, remainingCredits: 1 } }))
			.mockResolvedValueOnce(jsonResponse({ body: { body: 'scan', pageCount: 1, name: 'a.txt', credits: 21, remainingCredits: 1 } }));
		const plain = await runAction({ action: extractTextFromPdf, propsValue: { url: 'https://a.example/a.pdf' } });
		expect(plain).toEqual({ extractedText: 'hello', pageCount: 1, outputName: 'a.txt', creditsUsed: 4, remainingCredits: 1 });
		expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.pdf.co/v1/pdf/convert/to/text-simple');
		await runAction({ action: extractTextFromPdf, propsValue: { url: 'https://a.example/a.pdf', useOcr: true, lang: 'deu' } });
		expect(requestOf({ fetchMock, call: 1 })).toMatchObject({ url: 'https://api.pdf.co/v1/pdf/convert/to/text', body: { lang: 'deu', inline: true } });
	});

	it('Search and Replace rejects lists of different length before calling PDF.co (B6)', async () => {
		await expect(
			runAction({ action: searchAndReplaceText, propsValue: { url: 'https://a.example/a.pdf', searchStrings: ['a', 'b'], replaceStrings: ['x'] } }),
		).rejects.toThrow('Text to Locate has 2 entries but Replacement Text has 1');
		await expect(
			runAction({ action: searchAndReplaceText, propsValue: { url: 'https://a.example/a.pdf', searchStrings: [], replaceStrings: [] } }),
		).rejects.toThrow('at least one');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('Search and Replace sends strings, not raw values', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }));
		await runAction({ action: searchAndReplaceText, propsValue: { url: 'https://a.example/a.pdf', searchStrings: [2024], replaceStrings: [2025], replacementLimit: 1 } });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ searchStrings: ['2024'], replaceStrings: ['2025'], replacementLimit: 1 });
	});
});

describe('new file actions', () => {
	it('Merge PDFs joins URLs then uploaded files in order and saves the result by default', async () => {
		const written: { fileName: string; size: number }[] = [];
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse({ body: { presignedUrl: 'https://pdf-temp-files.s3.amazonaws.com/up/c.pdf?sig', url: 'https://pdf-temp-files.s3.amazonaws.com/up/c.pdf' } }),
			)
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }))
			.mockResolvedValueOnce(binaryResponse({ data: Buffer.from('merged') }));
		const result = await runAction({
			action: mergePdfs,
			propsValue: {
				sourceUrls: ['https://a.example/a.pdf', 'https://a.example/b.pdf'],
				sourceFiles: [{ file: { filename: 'c.pdf', data: Buffer.from('%PDF') } }],
				saveOutputFile: true,
			},
			written,
		});
		expect(requestOf({ fetchMock, call: 2 })).toMatchObject({
			url: 'https://api.pdf.co/v1/pdf/merge',
			body: { url: 'https://a.example/a.pdf,https://a.example/b.pdf,https://pdf-temp-files.s3.amazonaws.com/up/c.pdf', async: false },
		});
		expect(result).toMatchObject({ status: 'success', url: STORAGE_URL, file: 'https://files.example/result.pdf' });
	});

	it('Merge PDFs needs at least two inputs', async () => {
		await expect(runAction({ action: mergePdfs, propsValue: { sourceUrls: ['https://a.example/a.pdf'] } })).rejects.toThrow('at least two');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('Split PDF sends 1-based ranges and returns one link per part', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ body: { urls: ['https://pdf-temp-files.s3.amazonaws.com/p1.pdf', 'https://pdf-temp-files.s3.amazonaws.com/p2.pdf'], pageCount: 4, error: false } }),
		);
		const result = await runAction({ action: splitPdf, propsValue: { sourceUrl: 'https://a.example/a.pdf', pages: '1-2,3-' } });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ url: 'https://a.example/a.pdf', pages: '1-2,3-' });
		expect(result).toMatchObject({ urls: ['https://pdf-temp-files.s3.amazonaws.com/p1.pdf', 'https://pdf-temp-files.s3.amazonaws.com/p2.pdf'], page_count: 4 });
	});

	it('Delete Pages and Rotate send the documented fields', async () => {
		fetchMock.mockImplementation(async () => jsonResponse({ body: okFileResult() }));
		await runAction({ action: deletePdfPages, propsValue: { sourceUrl: 'https://a.example/a.pdf', pages: '1,3' } });
		await runAction({ action: rotatePdfPages, propsValue: { sourceUrl: 'https://a.example/a.pdf', angle: '180', pages: '' } });
		expect(requestOf({ fetchMock, call: 0 })).toMatchObject({ url: 'https://api.pdf.co/v1/pdf/edit/delete-pages', body: { pages: '1,3' } });
		const rotate = requestOf({ fetchMock, call: 1 });
		expect(rotate).toMatchObject({ url: 'https://api.pdf.co/v1/pdf/edit/rotate', body: { angle: 180 } });
		expect(rotate.body).not.toHaveProperty('pages');
	});

	it('Rotate rejects an angle that is not 90/180/270', async () => {
		await expect(runAction({ action: rotatePdfPages, propsValue: { sourceUrl: 'https://a.example/a.pdf', angle: '45' } })).rejects.toThrow('90, 180 or 270');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('Protect PDF sends permission flags explicitly (off by default, like PDF.co)', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }));
		await runAction({ action: addPasswordToPdf, propsValue: { sourceUrl: 'https://a.example/a.pdf', ownerPassword: 'own', allowPrintDocument: true } });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ ownerPassword: 'own', allowPrintDocument: true, allowModifyDocument: false });
	});

	it('Convert PDF to Images hits the format endpoint', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { urls: ['https://pdf-temp-files.s3.amazonaws.com/p0.png'], pageCount: 1 } }));
		await runAction({ action: convertPdfToImage, propsValue: { sourceUrl: 'https://a.example/a.pdf', format: 'webp' } });
		expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.pdf.co/v1/pdf/convert/to/webp');
	});

	it('Convert Document rejects extra image URLs for non-image sources', async () => {
		await expect(
			runAction({ action: convertDocumentToPdf, propsValue: { sourceType: 'document', sourceUrl: 'https://a.example/a.docx', extraImageUrls: ['https://a.example/b.png'] } }),
		).rejects.toThrow('only works with Source Type "Images"');
	});

	it('Fill PDF Form validates field names and can flatten', async () => {
		await expect(runAction({ action: fillPdfForm, propsValue: { sourceUrl: 'https://a.example/f.pdf', fields: [{ text: 'x' }] } })).rejects.toThrow(
			'Field #1 needs a field name',
		);
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }));
		await runAction({
			action: fillPdfForm,
			propsValue: { sourceUrl: 'https://a.example/f.pdf', fields: [{ fieldName: 'name', text: 'Jo', pages: 0 }], flatten: true, saveOutputFile: false },
		});
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({
			fields: [{ fieldName: 'name', text: 'Jo', pages: '0' }],
			profiles: JSON.stringify({ 'FlattenDocument()': [] }),
		});
	});
});

describe('new read actions', () => {
	it('Get Credit Balance flattens remainingCredits', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { remainingCredits: 9428 } }));
		await expect(runAction({ action: getCreditBalance, propsValue: {} })).resolves.toEqual({ remaining_credits: 9428 });
	});

	it('Get PDF Info flattens the info object', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ body: { info: { PageCount: 1, Title: 'T', Encrypted: false, PageRectangle: { Width: 612, Height: 792 } }, credits: 7, remainingCredits: 1 } }),
		);
		const result = await runAction({ action: getPdfInfo, propsValue: { sourceUrl: 'https://a.example/a.pdf' } });
		expect(result).toMatchObject({ page_count: 1, title: 'T', encrypted: false, page_width: 612, page_height: 792, credits_used: 7 });
	});

	it('Get PDF Form Fields lists fields with exact names', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ body: { info: { PageCount: 3, FieldsInfo: { Fields: [{ FieldName: 'f1', Type: 'Text', Value: '', PageIndex: 0 }] } } } }),
		);
		const result = await runAction({ action: getPdfFormFields, propsValue: { sourceUrl: 'https://a.example/a.pdf' } });
		expect(result).toMatchObject({ field_count: 1, fields: [{ field_name: 'f1', type: 'Text', page_index: 0 }] });
	});

	it('Find Text returns flat matches', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { body: [{ text: 'Invoice', pageIndex: 0, left: 1, top: 2, width: 3, height: 4 }], pageCount: 1 } }));
		const result = await runAction({ action: findTextInPdf, propsValue: { sourceUrl: 'https://a.example/a.pdf', searchString: 'Invoice' } });
		expect(result).toMatchObject({ match_count: 1, matches: [{ text: 'Invoice', page_index: 0 }] });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ searchString: 'Invoice', inline: true, async: false });
	});

	it('Read Barcodes sends the type list as a comma string', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { barcodes: [{ Value: 'abc', TypeName: 'QRCode', Page: 0, Rect: '{X=1}', Confidence: 1 }] } }));
		const result = await runAction({ action: readBarcodes, propsValue: { sourceUrl: 'https://a.example/a.pdf', types: ['QRCode', 'Code128'] } });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ types: 'QRCode,Code128' });
		expect(result).toMatchObject({ barcode_count: 1, barcodes: [{ value: 'abc', type: 'QRCode' }] });
	});

	it('Parse Invoice with AI always runs async and returns working with the job ID at the ceiling', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { error: false, status: 'created', jobId: 'INV1', credits: 100 } }))
			.mockImplementation(async () => jsonResponse({ body: { status: 'working' } }));
		const pending = runAction({ action: parseInvoiceWithAi, propsValue: { sourceUrl: 'https://a.example/inv.pdf' } });
		await vi.advanceTimersByTimeAsync(241_000);
		await expect(pending).resolves.toMatchObject({ status: 'working', job_id: 'INV1' });
		expect(requestOf({ fetchMock, call: 0 })).toMatchObject({ url: 'https://api.pdf.co/v1/ai-invoice-parser', body: { async: true } });
	});

	it('Parse Invoice with AI flattens the finished invoice', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { error: false, status: 'created', jobId: 'INV2' } }))
			.mockResolvedValueOnce(
				jsonResponse({
					body: {
						status: 'success',
						body: {
							vendor: { name: 'ACME' },
							customer: { billTo: { name: 'Lanny' } },
							invoice: { invoiceNo: '67', invoiceDate: 'JAN 5' },
							paymentDetails: { total: '$1', tax: '$0' },
							lineItems: [[{ description: 'Item 1' }]],
						},
						credits: 100,
					},
				}),
			);
		const pending = runAction({ action: parseInvoiceWithAi, propsValue: { sourceUrl: 'https://a.example/inv.pdf', customFields: ['deliveryDate'] } });
		await vi.advanceTimersByTimeAsync(3_000);
		await expect(pending).resolves.toMatchObject({
			status: 'success',
			vendor_name: 'ACME',
			customer_name: 'Lanny',
			invoice_number: '67',
			total: '$1',
			line_items: [{ description: 'Item 1' }],
		});
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ customField: 'deliveryDate' });
	});

	it('Parse Invoice rejects custom field names that are not camelCase words', async () => {
		await expect(runAction({ action: parseInvoiceWithAi, propsValue: { sourceUrl: 'https://a.example/inv.pdf', customFields: ['delivery date'] } })).rejects.toThrow(
			'camelCase',
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('Upload File returns the storage link, name and credits from the presigned step', async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse({
					body: {
						presignedUrl: 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/u/scan.png?X-Amz-SignedHeaders=host',
						url: STORAGE_URL,
						name: 'scan.png',
						outputLinkValidTill: '2026-10-05T20:00:00Z',
						credits: 7,
						remainingCredits: 9000,
						error: false,
					},
				}),
			)
			.mockResolvedValueOnce(new Response(null, { status: 200 }));
		await expect(runAction({ action: uploadFile, propsValue: { file: { filename: 'scan.png', data: Buffer.from('png') } } })).resolves.toEqual({
			url: STORAGE_URL,
			name: 'scan.png',
			link_valid_until: '2026-10-05T20:00:00Z',
			credits_used: 7,
			remaining_credits: 9000,
		});
		expect(requestOf({ fetchMock, call: 0 }).url).toContain('contenttype=image%2Fpng');
		expect(requestOf({ fetchMock, call: 1 }).headers['content-type']).toBe('image/png');
	});

	it('Upload File rejects a value that is not a file before any request', async () => {
		await expect(runAction({ action: uploadFile, propsValue: { file: 'not-a-file' } })).rejects.toThrow('could not be read');
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
