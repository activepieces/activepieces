import { FilesService, MarkdownVariant, OutputSchema, Property } from '@activepieces/pieces-framework';
import { datalabClient, DatalabActionOutput, DatalabAudience, DatalabOperation, DatalabTiming } from '../common/client';
import { datalabFiles } from '../common/files';
import { datalabGuards } from '../common/guards';
import { datalabProps } from '../common/props';
import { DatalabSource, datalabSource } from '../common/source';

const OPERATION: DatalabOperation = 'fill';
const DEFAULT_FILE_NAME = 'filled-form';
const HUMAN_MAX_WAIT_MS = 360_000;
const HUMAN_WAIT_MINUTES = Math.round(HUMAN_MAX_WAIT_MS / 60_000);
const AI_WAIT_MINUTES = Math.round(datalabClient.MAX_WAIT_MS / 60_000);
const USUAL_TIME = '1 to 4 minutes';
const DENSE_TIME = '5 to 8 minutes';
const DEFAULT_OUTPUT_FORMAT = 'pdf';
const FILE_TYPES = 'PDF (fillable, flat or scanned) or image (PNG, JPG)';
const CHECKBOX_HINT = 'To tick a checkbox, give "yes", "true", "1", "checked" or "x".';
const NOT_FOUND_HINT = 'Names that are not on the form come back in Fields Not Found; that is not an error.';

const outputSchema: OutputSchema = {
  fields: [
    ...datalabProps.envelopeFields(),
    {
      key: 'file',
      label: 'Filled Form',
      format: 'url',
      description: 'The filled form, stored in Activepieces. Pass it to any step that takes a file. A saved file is limited to 10 MB on Activepieces Cloud.',
    },
    { key: 'file_name', label: 'File Name' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'output_format', label: 'Output Format', description: 'pdf for a PDF form, png for an image form.' },
    { key: 'fields_filled', label: 'Fields Filled', description: 'Names of the fields Datalab filled.' },
    { key: 'fields_not_found', label: 'Fields Not Found', description: 'Names Datalab could not match to a field on the form. Nothing was written for them; this is not an error.' },
    { key: 'fields_filled_count', label: 'Fields Filled Count', format: 'number' },
    { key: 'page_count', label: 'Page Count', format: 'number' },
  ],
};

function humanProps() {
  return {
    slow_notice: Property.MarkDown({
      value: `**This action is slow.** One page usually takes ${USUAL_TIME}, and a dense form with many fields can take ${DENSE_TIME}. The step waits up to ${HUMAN_WAIT_MINUTES} minutes.`,
      variant: MarkdownVariant.INFO,
    }),
    ...datalabSource.humanProps({ noun: 'form', fileTypes: FILE_TYPES }),
    field_values: Property.Array({
      displayName: 'Field Values',
      description: 'One row per field. Use the label printed on the form.',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Field Name',
          description: 'The field label or name on the form, for example Full Name.',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'What to write, for example Jane Doe. For a checkbox, yes ticks it.',
          required: true,
        }),
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Optional hint that helps Datalab find the right field.',
          required: false,
        }),
      },
    }),
    form_context: formContext(),
    confidence_threshold: confidenceThreshold(),
    page_range: datalabProps.pageRange(),
    output_file_name: outputFileName(),
    skip_cache: datalabProps.skipCache(),
  };
}

function aiProps() {
  return {
    ...datalabSource.aiProps({ noun: 'form', fileTypes: FILE_TYPES }),
    field_values: Property.Json({
      displayName: 'Field Values',
      description: `JSON object that maps each form field label to its value. Either {"Full Name": "Jane Doe", "Start Date": "2026-01-15"} or, to add a hint, {"Full Name": {"value": "Jane Doe", "description": "employee's legal name"}}. Use the labels printed on the form; call Get Form Fields first to learn them. Numbers and booleans are sent as text. ${NOT_FOUND_HINT} ${CHECKBOX_HINT}`,
      required: true,
    }),
    form_context: formContext(),
    confidence_threshold: confidenceThreshold(),
    page_range: datalabProps.pageRange(),
    output_file_name: outputFileName(),
    skip_cache: datalabProps.skipCache(),
  };
}

function formContext() {
  return Property.LongText({
    displayName: 'Form Context',
    description: 'What the form is and who it is for, for example W-4 for a new hire.',
    required: false,
  });
}

function confidenceThreshold() {
  return Property.Number({
    displayName: 'Confidence Threshold',
    description: 'How sure Datalab must be to write a value, 0 to 1. Default 0.5.',
    required: false,
    advanced: true,
  });
}

function outputFileName() {
  return Property.ShortText({
    displayName: 'Output File Name',
    description: 'Name for the filled file. The extension is added for you.',
    placeholder: 'w4-jane-doe',
    required: false,
    advanced: true,
  });
}

function fieldsFromList(value: unknown): FillField[] {
  return datalabGuards.list(value).map((row, index) => {
    const entry = datalabGuards.record(row) ?? {};
    const name = typeof entry['name'] === 'string' ? entry['name'] : '';
    return {
      name,
      value: valueText({ value: entry['value'], label: name.trim().length > 0 ? `"${name.trim()}"` : `row ${index + 1}` }),
      description: datalabGuards.text(entry['description'])?.trim(),
    };
  });
}

function fieldsFromJson(value: unknown): FillField[] {
  const parsed = datalabGuards.parseJsonText(value);
  const map = datalabGuards.record(parsed);
  if (map === undefined) {
    throw new Error('field_values must be a JSON object that maps each field label to its value, for example {"Full Name": "Jane Doe"} or {"Full Name": {"value": "Jane Doe", "description": "legal name"}}.');
  }
  return Object.entries(map).map(([name, entry]) => {
    const label = `"${name.trim()}"`;
    const nested = datalabGuards.record(entry);
    if (nested === undefined) {
      return { name, value: valueText({ value: entry, label }) };
    }
    if (!('value' in nested)) {
      throw new Error(`Field ${label} must be a text value or an object with "value" (and an optional "description"), for example {"value": "Jane Doe"}.`);
    }
    return { name, value: valueText({ value: nested['value'], label }), description: datalabGuards.text(nested['description'])?.trim() };
  });
}

function toFieldData(fields: FillField[]): Record<string, FillFieldData> {
  if (fields.length === 0) {
    throw new Error('Give at least one field value to fill in. Run Get Form Fields to see the labels the form has.');
  }
  const data: Record<string, FillFieldData> = {};
  for (const [index, field] of fields.entries()) {
    const name = field.name.trim();
    if (name.length === 0) {
      throw new Error(`Field value ${index + 1} has no field name. Give the label printed on the form, for example Full Name.`);
    }
    if (name in data) {
      throw new Error(`The field name "${name}" is given more than once. Give each field one value.`);
    }
    data[name] = field.description === undefined || field.description.length === 0 ? { value: field.value } : { value: field.value, description: field.description };
  }
  return data;
}

function readThreshold(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const threshold = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new Error(`Confidence Threshold must be a number from 0 to 1, for example 0.7. Got ${String(value)}.`);
  }
  return threshold;
}

function valueText({ value, label }: { value: unknown; label: string }): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  throw new Error(`The value for field ${label} must be text, a number or true/false, not a list or object.`);
}

function fileNameFor({ fileName, outputFormat }: { fileName: unknown; outputFormat: string }): string {
  return datalabFiles.withExtension({ fileName, extension: outputFormat, fallback: DEFAULT_FILE_NAME });
}

function hasOutput(result: Record<string, unknown>): boolean {
  return datalabGuards.text(result['output_base64']) !== undefined;
}

async function shape({ result, files, options }: ShapeParams): Promise<FillOutput> {
  const base64 = datalabGuards.text(result['output_base64']);
  if (base64 === undefined) {
    throw new Error('Datalab finished the request but sent no filled form. If you used Get Result, check that the Request ID came from Fill Form, then try again.');
  }
  const outputFormat = datalabGuards.text(result['output_format'])?.trim().toLowerCase() ?? DEFAULT_OUTPUT_FORMAT;
  const saved = await datalabFiles.saveBase64({ files, base64, fileName: fileNameFor({ fileName: options?.fileName, outputFormat }) });
  const fieldsFilled = datalabGuards.textList(result['fields_filled']);
  return {
    ...saved,
    output_format: outputFormat,
    fields_filled: fieldsFilled,
    fields_not_found: datalabGuards.textList(result['fields_not_found']),
    fields_filled_count: fieldsFilled.length,
    page_count: datalabGuards.finiteNumber(result['page_count']) ?? null,
  };
}

async function run({ apiKey, audience, source, fields, context, confidenceThreshold, pageRange, outputFileName, skipCache, files, timing }: RunParams): Promise<DatalabActionOutput<FillOutput>> {
  const fieldData = toFieldData(fields);
  const threshold = readThreshold(confidenceThreshold);
  const range = datalabProps.readPageRange(pageRange);
  const body = datalabSource.newForm({
    source,
    fields: {
      field_data: JSON.stringify(fieldData),
      context: datalabGuards.text(context)?.trim(),
      confidence_threshold: threshold,
      page_range: range,
      skip_cache: skipCache === true,
    },
  });
  const outcome = await datalabClient.runJob({ apiKey, operation: OPERATION, body, timing, maxWaitMs: audience === 'human' ? HUMAN_MAX_WAIT_MS : undefined });
  return datalabClient.finish({
    outcome,
    operation: OPERATION,
    audience,
    shape: (result) => shape({ result, files, options: { fileName: outputFileName } }),
  });
}

export const fillOperation = {
  DEFAULT_FILE_NAME,
  HUMAN_MAX_WAIT_MS,
  HUMAN_WAIT_MINUTES,
  AI_WAIT_MINUTES,
  USUAL_TIME,
  DENSE_TIME,
  outputSchema,
  humanProps,
  aiProps,
  fieldsFromList,
  fieldsFromJson,
  toFieldData,
  readThreshold,
  hasOutput,
  shape,
  run,
};

export type FillField = {
  name: string;
  value: string;
  description?: string;
};

export type FillFieldData = {
  value: string;
  description?: string;
};

export type FillOutput = {
  file: string;
  file_name: string;
  size: number;
  output_format: string;
  fields_filled: string[];
  fields_not_found: string[];
  fields_filled_count: number;
  page_count: number | null;
};

export type FillShapeOptions = {
  fileName?: unknown;
};

type ShapeParams = {
  result: Record<string, unknown>;
  files: FilesService;
  options?: FillShapeOptions;
};

type RunParams = {
  apiKey: string;
  audience: DatalabAudience;
  source: DatalabSource;
  fields: FillField[];
  context: unknown;
  confidenceThreshold: unknown;
  pageRange: unknown;
  outputFileName: unknown;
  skipCache: unknown;
  files: FilesService;
  timing?: DatalabTiming;
};
