import { FilesService, OutputSchema, Property } from '@activepieces/pieces-framework';
import { datalabClient, DatalabActionOutput, DatalabAudience, DatalabOperation, DatalabTiming } from '../common/client';
import { datalabGuards } from '../common/guards';
import { datalabProps } from '../common/props';
import { DatalabSource, datalabSource } from '../common/source';

const OPERATION: DatalabOperation = 'form-fields';
const FILE_TYPES = 'PDF (fillable, flat or scanned) or image (PNG, JPG)';

const outputSchema: OutputSchema = {
  fields: [
    ...datalabProps.envelopeFields(),
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      description: 'Every field found, across all pages. The label is what identifies a field; pass it as the field name to Fill Form.',
      listItems: [
        { key: 'page', label: 'Page', format: 'number', description: 'Page the field is on, counted from 0.' },
        { key: 'label', label: 'Label', description: 'The text printed next to the field, for example "Full Name:".' },
        { key: 'name', label: 'Name', description: 'The fillable field name inside the PDF, when Datalab reports one. Often empty.' },
        { key: 'field_type', label: 'Field Type', description: 'What the field holds, for example text, name, email, date or checkbox.' },
        { key: 'left', label: 'Left', format: 'number', description: 'Left edge as a fraction of the page width, from 0 to 1.' },
        { key: 'top', label: 'Top', format: 'number', description: 'Top edge as a fraction of the page height, from 0 to 1.' },
        { key: 'right', label: 'Right', format: 'number', description: 'Right edge as a fraction of the page width, from 0 to 1.' },
        { key: 'bottom', label: 'Bottom', format: 'number', description: 'Bottom edge as a fraction of the page height, from 0 to 1.' },
      ],
    },
    { key: 'field_count', label: 'Field Count', format: 'number' },
    {
      key: 'pages',
      label: 'Pages',
      labelKey: 'page',
      listItems: [
        { key: 'page', label: 'Page', format: 'number', description: 'Page number, counted from 0.' },
        { key: 'field_count', label: 'Field Count', format: 'number' },
        { key: 'text', label: 'Text', description: 'The page text. Only set when Include Page Text is on.' },
        { key: 'error', label: 'Error', description: 'Why Datalab could not read this page. Empty when the page was read.' },
      ],
    },
    { key: 'page_count', label: 'Page Count', format: 'number' },
  ],
};

function humanProps() {
  return {
    ...datalabSource.humanProps({ noun: 'form', fileTypes: FILE_TYPES }),
    include_text: includeText(),
    page_range: datalabProps.pageRange(),
    max_pages: datalabProps.maxPages(),
    skip_cache: datalabProps.skipCache(),
  };
}

function aiProps() {
  return {
    ...datalabSource.aiProps({ noun: 'form', fileTypes: FILE_TYPES }),
    include_text: includeText(),
    page_range: datalabProps.pageRange(),
    max_pages: datalabProps.maxPages(),
    skip_cache: datalabProps.skipCache(),
  };
}

function includeText() {
  return Property.Checkbox({
    displayName: 'Include Page Text',
    description: 'Turn on to also return the text of each page, which helps tell similar fields apart. Off by default.',
    required: false,
    defaultValue: false,
    advanced: true,
  });
}

function hasOutput(result: Record<string, unknown>): boolean {
  return Array.isArray(result['pages']);
}

function shape({ result }: ShapeParams): FormFieldsOutput {
  const fields: FormField[] = [];
  const pages: FormFieldsPage[] = [];
  for (const [index, entry] of datalabGuards.list(result['pages']).entries()) {
    const page = datalabGuards.record(entry) ?? {};
    const pageNumber = datalabGuards.finiteNumber(page['page']) ?? index;
    const pageFields = datalabGuards.list(page['fields']).map((field) => toField({ field, page: pageNumber }));
    fields.push(...pageFields);
    pages.push({
      page: pageNumber,
      field_count: pageFields.length,
      text: datalabGuards.text(page['text']) ?? null,
      error: datalabGuards.text(page['error']) ?? null,
    });
  }
  return {
    fields,
    field_count: fields.length,
    pages,
    page_count: datalabGuards.finiteNumber(result['page_count']) ?? pages.length,
  };
}

function toField({ field, page }: { field: unknown; page: number }): FormField {
  const entry = datalabGuards.record(field) ?? {};
  const bbox = datalabGuards.numberList(entry['bbox']);
  const hasBox = bbox.length === 4;
  return {
    page,
    label: datalabGuards.text(entry['label']) ?? '',
    name: datalabGuards.text(entry['name']) ?? '',
    field_type: datalabGuards.text(entry['field_type']) ?? '',
    left: hasBox ? bbox[0] : null,
    top: hasBox ? bbox[1] : null,
    right: hasBox ? bbox[2] : null,
    bottom: hasBox ? bbox[3] : null,
  };
}

async function run({ apiKey, audience, source, includeText, pageRange, maxPages, skipCache, files, timing }: RunParams): Promise<DatalabActionOutput<FormFieldsOutput>> {
  const body = datalabSource.newForm({
    source,
    fields: {
      include_text: includeText === true,
      ...datalabProps.readPaging({ pageRange, maxPages }),
      skip_cache: skipCache === true,
    },
  });
  const outcome = await datalabClient.runJob({ apiKey, operation: OPERATION, body, timing });
  return datalabClient.finish({
    outcome,
    operation: OPERATION,
    audience,
    shape: (result) => shape({ result, files }),
  });
}

export const formFieldsOperation = { outputSchema, humanProps, aiProps, hasOutput, shape, run };

export type FormField = {
  page: number;
  label: string;
  name: string;
  field_type: string;
  left: number | null;
  top: number | null;
  right: number | null;
  bottom: number | null;
};

export type FormFieldsPage = {
  page: number;
  field_count: number;
  text: string | null;
  error: string | null;
};

export type FormFieldsOutput = {
  fields: FormField[];
  field_count: number;
  pages: FormFieldsPage[];
  page_count: number;
};

type ShapeParams = {
  result: Record<string, unknown>;
  files: FilesService;
  options?: Record<string, unknown>;
};

type RunParams = {
  apiKey: string;
  audience: DatalabAudience;
  source: DatalabSource;
  includeText: unknown;
  pageRange: unknown;
  maxPages: unknown;
  skipCache: unknown;
  files: FilesService;
  timing?: DatalabTiming;
};
