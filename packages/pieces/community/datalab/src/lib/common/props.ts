import { OutputSchemaField, Property } from '@activepieces/pieces-framework';

function pageRange() {
  return Property.ShortText({
    displayName: 'Page Range',
    description: 'Pages to process, counted from 0. Use commas and ranges, for example 0,5-10,20 for the first page, pages 6 to 11 and page 21. Leave empty for the whole document.',
    placeholder: '0,5-10,20',
    required: false,
    advanced: true,
  });
}

function maxPages() {
  return Property.Number({
    displayName: 'Max Pages',
    description: 'Stop after this many pages, counted from the start. Leave empty for no limit. Ignored when Page Range is set.',
    required: false,
    advanced: true,
  });
}

function skipCache() {
  return Property.Checkbox({
    displayName: 'Skip Cache',
    description: 'Turn on to process the document again even if Datalab already has a result for the same file and options. A fresh run is billed again.',
    required: false,
    defaultValue: false,
    advanced: true,
  });
}

function readPageRange(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  const range = value.replace(/\s+/g, '');
  if (!/^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(range)) {
    throw new Error(`Page Range "${value}" is not valid. Use page numbers counted from 0, with commas and ranges, for example 0,5-10,20.`);
  }
  return range;
}

function readMaxPages(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const pages = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(pages) || pages < 1) {
    throw new Error('Max Pages must be a whole number of 1 or more, or empty for no limit.');
  }
  return pages;
}

function readPaging({ pageRange, maxPages }: { pageRange: unknown; maxPages: unknown }): { page_range: string | undefined; max_pages: number | undefined } {
  const range = readPageRange(pageRange);
  const pages = readMaxPages(maxPages);
  return { page_range: range, max_pages: range === undefined ? pages : undefined };
}

function envelopeFields(): OutputSchemaField[] {
  return [
    { key: 'completed', label: 'Completed', format: 'boolean', description: 'False when Datalab was still working when the wait ran out. Use Get Result with the Request ID to collect it.' },
    { key: 'status', label: 'Status', description: 'complete when the result is ready, otherwise processing.' },
    { key: 'request_id', label: 'Request ID', description: 'Pass this to Get Result to fetch the result again within about one day.' },
    { key: 'message', label: 'Message', description: 'Only set when Completed is false: what to do next.' },
  ];
}

export const datalabProps = { pageRange, maxPages, skipCache, readPageRange, readMaxPages, readPaging, envelopeFields };
