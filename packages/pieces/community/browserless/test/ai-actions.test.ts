import { afterEach, describe, expect, test, vi } from 'vitest';
import { auditPagePerformance } from '../src/lib/actions/ai/audit-page-performance';
import { createPdf } from '../src/lib/actions/ai/create-pdf';
import { takeScreenshot } from '../src/lib/actions/ai/take-screenshot';
import { browserlessOutputSchemas } from '../src/lib/output-schemas';
import { missingSchemaPaths, replies, runAction, stubFetch } from './helpers';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('take_screenshot (ai)', () => {
    test('url source: stores the image and returns only file metadata', async () => {
        const seen = stubFetch(replies([{ binary: PNG, headers: { 'x-response-code': '200' } }]));
        const { output, written } = await runAction({
            action: takeScreenshot,
            propsValue: { url: 'https://example.com', imageType: 'jpeg', quality: 70, fullPage: true, width: 1024, height: 768, selector: '#main', waitForTimeout: 200, timeout: 30000 },
        });
        expect(seen[0].path).toBe('/screenshot');
        expect(seen[0].query.get('timeout')).toBe('30000');
        expect(seen[0].body).toEqual({
            url: 'https://example.com',
            options: { type: 'jpeg', fullPage: true, quality: 70 },
            viewport: { width: 1024, height: 768 },
            selector: '#main',
            waitForTimeout: 200,
        });
        expect(written[0]).toMatchObject({ fileName: 'screenshot.jpg' });
        expect(output).toEqual({ file: 'https://files.example/screenshot.jpg', file_name: 'screenshot.jpg', size_bytes: 4, mime_type: 'image/jpeg', source: 'https://example.com', site_status_code: 200 });
        expect(JSON.stringify(output)).not.toMatch(/base64/i);
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.fileOnly.fields })).toEqual([]);
    });
    test('html source and exactly-one validation', async () => {
        const seen = stubFetch(replies([{ binary: PNG }]));
        const { output } = await runAction({ action: takeScreenshot, propsValue: { html: '<h1>Hi</h1>' } });
        expect(seen[0].body).toEqual({ html: '<h1>Hi</h1>', options: { type: 'png', fullPage: false } });
        expect(output).toMatchObject({ source: 'html', mime_type: 'image/png' });
        await expect(runAction({ action: takeScreenshot, propsValue: {} })).rejects.toThrow(/exactly one of URL or HTML/);
        await expect(runAction({ action: takeScreenshot, propsValue: { url: 'https://a.com', html: '<p>' } })).rejects.toThrow(/exactly one of URL or HTML/);
        await expect(runAction({ action: takeScreenshot, propsValue: { url: 'https://a.com', width: 100 } })).rejects.toThrow(/Viewport Width and Viewport Height/);
    });
});

describe('create_pdf (ai)', () => {
    test('renders html with one margin for all sides and returns only the file', async () => {
        const seen = stubFetch(replies([{ binary: Buffer.from('%PDF-1.7') }]));
        const { output, written } = await runAction({ action: createPdf, propsValue: { html: '<h1>Invoice</h1>', format: 'Letter', landscape: true, margin: '10mm' } });
        expect(seen[0].path).toBe('/pdf');
        expect(seen[0].body).toEqual({
            html: '<h1>Invoice</h1>',
            options: { format: 'Letter', landscape: true, printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } },
        });
        expect(written[0].fileName).toBe('document.pdf');
        expect(output).toEqual({ file: 'https://files.example/document.pdf', file_name: 'document.pdf', size_bytes: 8, mime_type: 'application/pdf', source: 'html', site_status_code: null });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.fileOnly.fields })).toEqual([]);
    });
});

describe('audit_page_performance (ai)', () => {
    test('returns the summary only, never the raw report', async () => {
        const lhr = {
            lighthouseVersion: '13.5.0',
            finalDisplayedUrl: 'https://example.com/',
            categories: { performance: { score: 1 }, seo: { score: 0.8 } },
            audits: { 'first-contentful-paint': { displayValue: '0.2 s', numericValue: 245, score: 1 }, 'unused-css-rules': { displayValue: 'Est savings 5 KiB', details: { items: [{}] } } },
            fullPageScreenshot: { data: 'x'.repeat(10_000) },
        };
        const seen = stubFetch(replies([{ body: { type: 'json', data: lhr } }]));
        const { output } = await runAction({ action: auditPagePerformance, propsValue: { url: 'https://example.com', device: 'mobile', categories: ['performance', 'seo'] } });
        expect(seen[0].path).toBe('/performance');
        expect(seen[0].body).toMatchObject({ url: 'https://example.com', config: { settings: { formFactor: 'mobile', onlyCategories: ['performance', 'seo'], maxWaitForLoad: 45000 } } });
        expect(output).toMatchObject({
            scores: { performance: 100, seo: 80, accessibility: null, bestPractices: null },
            metrics: { firstContentfulPaint: { value: '0.2 s', score: 100 } },
            opportunities: [{ type: 'unused-css' }],
            finalUrl: 'https://example.com/',
            lighthouseVersion: '13.5.0',
        });
        expect(JSON.stringify(output).length).toBeLessThan(3000);
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.auditPagePerformance.fields })).toEqual([]);
    });
});
