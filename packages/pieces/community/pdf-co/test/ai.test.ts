import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pdfCoConvertPdf, pdfCoEditPdf, pdfCoParseDocument } from '../src/lib/actions';
import { installFetch, jsonResponse, okFileResult, requestOf, runAction } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
	fetchMock = installFetch();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Convert PDF (AI)', () => {
	it('returns inline content cut to max_chars with a truncated flag', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { body: 'abcdefghij', pageCount: 1, credits: 4 } }));
		const result = await runAction({ action: pdfCoConvertPdf, propsValue: { source_url: 'https://a.example/a.pdf', max_chars: 4 } });
		expect(result).toMatchObject({ format: 'text', content: 'abcd', truncated: true, total_chars: 10 });
		expect(requestOf({ fetchMock, call: 0 })).toMatchObject({ url: 'https://api.pdf.co/v1/pdf/convert/to/text-simple', body: { inline: true } });
	});

	it('stringifies JSON content and rejects unknown formats', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { body: { document: { page: [] } } } }));
		const result = await runAction({ action: pdfCoConvertPdf, propsValue: { source_url: 'https://a.example/a.pdf', format: 'JSON' } });
		expect(result).toMatchObject({ format: 'json', content: '{"document":{"page":[]}}', truncated: false });
		await expect(runAction({ action: pdfCoConvertPdf, propsValue: { source_url: 'https://a.example/a.pdf', format: 'docx' } })).rejects.toThrow('format must be one of');
	});
});

describe('Edit PDF (AI)', () => {
	it('sends annotations, images and fields in one request', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }));
		await runAction({
			action: pdfCoEditPdf,
			propsValue: {
				source_url: 'https://a.example/a.pdf',
				annotations: [{ text: 'Hi', x: '10', y: 20, pages: 0 }],
				images: '[{"url":"https://a.example/logo.png","x":1,"y":2}]',
				fields: [{ fieldName: 'f', text: 'v' }],
			},
		});
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({
			annotations: [{ text: 'Hi', x: 10, y: 20, pages: '0' }],
			images: [{ url: 'https://a.example/logo.png', x: 1, y: 2 }],
			fields: [{ fieldName: 'f', text: 'v' }],
			async: false,
		});
	});

	it('rejects unknown keys, missing coordinates and empty edits before calling PDF.co', async () => {
		await expect(runAction({ action: pdfCoEditPdf, propsValue: { source_url: 'https://a.example/a.pdf', annotations: [{ text: 'a', x: 1, y: 2, bogus: 1 }] } })).rejects.toThrow(
			'unknown keys: bogus',
		);
		await expect(runAction({ action: pdfCoEditPdf, propsValue: { source_url: 'https://a.example/a.pdf', images: [{ url: 'https://a.example/i.png', x: 1 }] } })).rejects.toThrow(
			'missing: y',
		);
		await expect(runAction({ action: pdfCoEditPdf, propsValue: { source_url: 'https://a.example/a.pdf' } })).rejects.toThrow('at least one item');
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('Parse Document (AI)', () => {
	it('flattens fields and tables and validates the template ID', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({
				body: {
					body: {
						templateName: 'Invoice Parser',
						objects: [
							{ name: 'total', objectType: 'field', value: 6.58 },
							{ name: 'items', objectType: 'table', pageIndex: 0, rows: [[{ cellType: 'field' }]] },
						],
					},
					pageCount: 1,
				},
			}),
		);
		const result = await runAction({ action: pdfCoParseDocument, propsValue: { source_url: 'https://a.example/inv.pdf', template_id: '1' } });
		expect(result).toMatchObject({ template_name: 'Invoice Parser', fields: { total: 6.58 }, tables: [{ name: 'items', page_index: 0 }] });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ templateId: 1, inline: true });
		await expect(runAction({ action: pdfCoParseDocument, propsValue: { source_url: 'https://a.example/inv.pdf', template_id: 'abc' } })).rejects.toThrow(
			'positive whole number',
		);
	});
});
