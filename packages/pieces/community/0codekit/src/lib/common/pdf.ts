import { ApFile, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitFiles } from './files';

export const zeroCodeKitPdf = {
    pdfFile,
    fileName,
    renderProps,
    renderOptions,
    download,
    baseName,
    isApFile,
    clean,
};

function pdfFile({ displayName, description }: { displayName: string; description: string }) {
    return Property.File({
        displayName,
        description,
        required: true,
    });
}

function fileName({ description }: { description: string }) {
    return Property.ShortText({
        displayName: 'File Name',
        description,
        required: false,
        placeholder: 'document.pdf',
    });
}

function renderProps() {
    return {
        format: Property.StaticDropdown({
            displayName: 'Page Size',
            description: 'The paper size of the PDF pages.',
            required: false,
            defaultValue: 'A4',
            options: {
                options: PAGE_FORMATS.map((format) => ({ label: format, value: format })),
            },
        }),
        landscape: Property.Checkbox({
            displayName: 'Landscape',
            description: 'Lay the pages out horizontally instead of vertically.',
            required: false,
            defaultValue: false,
        }),
        printBackground: Property.Checkbox({
            displayName: 'Print Background',
            description: 'Include background colors and images from the page.',
            required: false,
            defaultValue: true,
        }),
        margin: Property.ShortText({
            displayName: 'Margin',
            description: 'Space around the content on every side, with a unit such as `1cm`, `10mm`, `0.5in` or `20px`. Leave empty for no margin.',
            required: false,
            placeholder: '1cm',
        }),
        scale: Property.Number({
            displayName: 'Scale',
            description: 'Zoom level of the rendered page, between 0.1 and 2. Leave empty for 1 (actual size).',
            required: false,
        }),
        pageRanges: Property.ShortText({
            displayName: 'Page Ranges',
            description: 'Only keep these pages, for example `1-3,5`. Leave empty to keep all pages.',
            required: false,
            placeholder: '1-3,5',
        }),
        displayHeaderFooter: Property.Checkbox({
            displayName: 'Show Header and Footer',
            description: 'Print the default browser header and footer (date, title, page numbers) on every page.',
            required: false,
            defaultValue: false,
        }),
    };
}

function renderOptions(values: RenderOptionValues): Record<string, unknown> {
    const margin = clean(values.margin);
    const pageRanges = clean(values.pageRanges);
    const options: Record<string, unknown> = {
        format: values.format ?? 'A4',
        landscape: values.landscape ?? false,
        printBackground: values.printBackground ?? true,
        displayHeaderFooter: values.displayHeaderFooter ?? false,
    };
    if (margin !== undefined) {
        options['margin'] = { top: margin, bottom: margin, left: margin, right: margin };
    }
    if (values.scale !== undefined && values.scale !== null) {
        if (values.scale < 0.1 || values.scale > 2) {
            throw new Error('Scale must be between 0.1 and 2.');
        }
        options['scale'] = values.scale;
    }
    if (pageRanges !== undefined) {
        options['pageRanges'] = pageRanges;
    }
    return options;
}

async function download({ url, timeoutMs }: { url: string; timeoutMs?: number }): Promise<Buffer> {
    return zeroCodeKitFiles.download({ url, timeoutMs, failure: 'Could not download the split PDF part.' });
}

function baseName({ name, fallback }: { name: string | undefined | null; fallback: string }): string {
    const trimmed = (name ?? '').trim().replace(/\.pdf$/i, '');
    return trimmed === '' ? fallback : trimmed;
}

function isApFile(value: unknown): value is ApFile {
    return (
        value !== null &&
        typeof value === 'object' &&
        'data' in value &&
        Buffer.isBuffer(value.data) &&
        'filename' in value &&
        typeof value.filename === 'string'
    );
}

function clean(value: string | undefined | null): string | undefined {
    const trimmed = (value ?? '').trim();
    return trimmed === '' ? undefined : trimmed;
}

const PAGE_FORMATS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'Letter', 'Legal', 'Tabloid', 'Ledger'];

export type RenderOptionValues = {
    format?: string | null;
    landscape?: boolean | null;
    printBackground?: boolean | null;
    margin?: string | null;
    scale?: number | null;
    pageRanges?: string | null;
    displayHeaderFooter?: boolean | null;
};
