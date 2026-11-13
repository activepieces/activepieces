import { FilesService, OutputSchema, Property } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { DatalabActionOutput, DatalabAudience, datalabClient, DatalabFormValue, DatalabTiming } from '../common/client';
import { datalabGuards } from '../common/guards';
import { datalabProps } from '../common/props';
import { DatalabSource, datalabSource } from '../common/source';

const NOUN = 'document';
const EXTRACTION_MODES: ExtractionMode[] = ['turbo', 'fast', 'balanced', 'accurate'];
const PARSE_MODES: ParseMode[] = ['fast', 'balanced', 'accurate'];
const FIELD_TYPES: SimpleFieldType[] = ['string', 'number', 'boolean'];
const HELPER_SUFFIXES: Array<{ suffix: string; kind: HelperKind }> = [
  { suffix: '_citations', kind: 'citations' },
  { suffix: '_meta', kind: 'meta' },
  { suffix: '_score', kind: 'score' },
];
const SCHEMA_EXAMPLE = '{"type": "object", "properties": {"invoice_number": {"type": "string"}}}';

const outputSchema: OutputSchema = {
  fields: [
    ...datalabProps.envelopeFields(),
    {
      key: 'data',
      label: 'Extracted Data',
      description: 'The extracted values, shaped like your fields or JSON Schema: one key per field, with nested objects and lists as you defined them. A value Datalab could not find is null.',
    },
    {
      key: 'citations',
      label: 'Citations',
      dynamicKey: true,
      description:
        'Where each value was found, keyed by field path such as invoice_number, vendor.name or line_items[0].amount. Block detail gives block IDs such as /page/0/Text/3 (pages counted from 0); phrase detail gives the matched text, page and position. Empty in Turbo mode.',
    },
    {
      key: 'details',
      label: 'Field Checks',
      dynamicKey: true,
      description:
        'Per-field checks, keyed by the same field paths. Balanced and Accurate give extraction_status, reasoning and verification for each field. score (1 to 5) and score_reasoning are present only when Datalab had already scored the field.',
      children: [
        { key: 'extraction_status', label: 'Extraction Status', description: 'EXTRACTED, or NOT_RESOLVABLE when the document does not hold a value.' },
        { key: 'reasoning', label: 'Reasoning' },
        {
          key: 'verification',
          label: 'Verification',
          children: [
            { key: 'status', label: 'Status', description: 'PASS, or a FAIL_ status when the check did not confirm the value.' },
            { key: 'feedback', label: 'Feedback' },
          ],
        },
        { key: 'score', label: 'Score', format: 'number' },
        { key: 'score_reasoning', label: 'Score Reasoning' },
      ],
    },
    {
      key: 'score_average',
      label: 'Average Score',
      format: 'number',
      description: 'Average field score from 1 to 5, or null when Datalab had not scored the fields. In Fast mode scores arrive after the result and are not waited for.',
    },
    { key: 'extraction_mode', label: 'Extraction Mode', description: 'The extraction mode Datalab used: turbo, fast, balanced or accurate.' },
    { key: 'page_count', label: 'Page Count', format: 'number' },
  ],
};

function humanProps() {
  return {
    ...datalabSource.humanProps({ noun: NOUN }),
    schema_type: Property.StaticDropdown<SchemaType, true>({
      displayName: 'Describe the Fields',
      description: 'List the fields one by one, or paste a JSON Schema when you need nested objects or lists such as line items.',
      display: 'cards',
      required: true,
      defaultValue: 'simple',
      options: {
        options: [
          { label: 'Simple', value: 'simple', description: 'List fields', icon: 'sliders' },
          { label: 'Advanced', value: 'advanced', description: 'JSON Schema', icon: 'code' },
        ],
      },
    }),
    schema: Property.DynamicProperties({
      auth: datalabAuth,
      displayName: 'Fields to Extract',
      required: true,
      refreshers: ['schema_type'],
      props: async (propsValue) => (propsValue['schema_type'] === 'advanced' ? advancedSchemaProps() : simpleSchemaProps()),
    }),
    extraction_mode: extractionModeProp({ audience: 'human' }),
    page_range: datalabProps.pageRange(),
    max_pages: datalabProps.maxPages(),
    citation_granularity: citationProp({ audience: 'human' }),
    parse_mode: Property.StaticDropdown<ParseMode, false>({
      displayName: 'Parse Mode',
      description:
        'How carefully Datalab reads the document before extracting. Leave empty to let Datalab choose: it reads carefully for Balanced and Accurate, and quickly for Fast. Ignored in Turbo mode, which skips this step.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Fast', value: 'fast' },
          { label: 'Balanced', value: 'balanced' },
          { label: 'Accurate', value: 'accurate' },
        ],
      },
    }),
    skip_cache: datalabProps.skipCache(),
  };
}

function aiProps() {
  return {
    ...datalabSource.aiProps({ noun: NOUN }),
    json_schema: Property.Json({
      displayName: 'JSON Schema',
      description:
        'JSON Schema of the fields to extract. The top level must be an object with a non-empty "properties" key, for example {"type": "object", "properties": {"invoice_number": {"type": "string", "description": "The invoice number"}, "total": {"type": "number"}}}. Use nested objects and arrays for groups and line items, and add a "description" to each field to guide the extraction.',
      required: true,
    }),
    extraction_mode: extractionModeProp({ audience: 'ai' }),
    page_range: datalabProps.pageRange(),
    max_pages: datalabProps.maxPages(),
    citation_granularity: citationProp({ audience: 'ai' }),
    skip_cache: datalabProps.skipCache(),
  };
}

function simpleSchemaProps() {
  return {
    fields: Property.Array({
      displayName: 'Fields',
      description: 'One row per value to pull out of the document.',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          description: 'Short, unique name for this value in the output.',
          placeholder: 'invoice_total',
          required: true,
        }),
        description: Property.LongText({
          displayName: 'Description',
          description: 'What to look for. A clear description gives better results.',
          placeholder: 'Total amount due, including tax',
          required: false,
        }),
        type: Property.StaticDropdown<SimpleFieldType, true>({
          displayName: 'Type',
          description: 'The kind of value to return.',
          required: true,
          defaultValue: 'string',
          options: {
            options: [
              { label: 'Text', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Yes / No', value: 'boolean' },
            ],
          },
        }),
        required: Property.Checkbox({
          displayName: 'Required',
          description: 'Tells Datalab this field should always be filled. The step does not fail when the value is not found; it returns null.',
          required: false,
          defaultValue: false,
        }),
      },
    }),
  };
}

function advancedSchemaProps() {
  return {
    fields: Property.Json({
      displayName: 'JSON Schema',
      description: 'A JSON Schema whose top level is an object with a "properties" key listing the fields. Nested objects and arrays are supported. See json-schema.org to learn more.',
      required: true,
      defaultValue: {
        type: 'object',
        properties: {
          invoice_number: { type: 'string', description: 'The invoice number' },
          total: { type: 'number', description: 'Total amount due' },
          line_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                amount: { type: 'number' },
              },
            },
          },
        },
        required: ['invoice_number'],
      },
    }),
  };
}

function extractionModeProp({ audience }: { audience: DatalabAudience }) {
  const description =
    audience === 'ai'
      ? 'turbo, fast, balanced or accurate. Default balanced. turbo is cheapest and fastest but has no citations or checks. fast adds citations; its scores arrive later and are not waited for. balanced and accurate check each field against the document and take longer (about half a minute for two pages).'
      : 'Turbo is the cheapest and fastest: values only, with no citations and no checks. Fast adds citations; its field scores arrive after the result and are not waited for. Balanced (the default) and Accurate also check each field against the document, so they take longer (about half a minute for two pages in our test). Accurate is the most thorough and costs the most.';
  return Property.StaticDropdown<ExtractionMode, false>({
    displayName: 'Extraction Mode',
    description,
    required: false,
    defaultValue: 'balanced',
    options: {
      options: [
        { label: 'Turbo', value: 'turbo' },
        { label: 'Fast', value: 'fast' },
        { label: 'Balanced', value: 'balanced' },
        { label: 'Accurate', value: 'accurate' },
      ],
    },
  });
}

function citationProp({ audience }: { audience: DatalabAudience }) {
  const description =
    audience === 'ai'
      ? 'block (default) returns block IDs such as /page/0/Text/3; phrase returns the matched text with its page and position. Ignored in turbo mode.'
      : 'Block (the default) gives the ID of the text block each value came from, such as /page/0/Text/3. Phrase gives the exact matched text with its page and position. Ignored in Turbo mode, which has no citations.';
  return Property.StaticDropdown<CitationGranularity, false>({
    displayName: 'Citation Detail',
    description,
    required: false,
    defaultValue: 'block',
    advanced: true,
    options: {
      options: [
        { label: 'Block', value: 'block' },
        { label: 'Phrase', value: 'phrase' },
      ],
    },
  });
}

function readHuman(values: HumanValues): ExtractInput {
  const source = datalabSource.fromHuman({ source: values.source, file: values.file, fileUrl: values.file_url, noun: NOUN });
  const schemaValues = datalabGuards.record(values.schema) ?? {};
  const schema = values.schema_type === 'advanced' ? checkSchema(schemaValues['fields']) : fieldsToSchema(schemaValues['fields']);
  return { source, schema, parseMode: readParseMode(values.parse_mode), ...readOptions(values) };
}

function readAi(values: AiValues): ExtractInput {
  const source = datalabSource.fromAi({ fileUrl: values.file_url, noun: NOUN });
  return { source, schema: checkSchema(values.json_schema), parseMode: undefined, ...readOptions(values) };
}

function readOptions(values: CommonValues): Omit<ExtractInput, 'source' | 'schema' | 'parseMode'> {
  return {
    extractionMode: readExtractionMode(values.extraction_mode),
    citationGranularity: values.citation_granularity === 'phrase' ? 'phrase' : 'block',
    pageRange: datalabProps.readPageRange(values.page_range),
    maxPages: datalabProps.readMaxPages(values.max_pages),
    skipCache: values.skip_cache === true,
  };
}

function readExtractionMode(value: unknown): ExtractionMode {
  const mode = datalabGuards.text(value)?.trim().toLowerCase();
  if (mode === undefined) {
    return 'balanced';
  }
  const known = EXTRACTION_MODES.find((entry) => entry === mode);
  if (known === undefined) {
    throw new Error(`Extraction Mode "${mode}" is not known. Use turbo, fast, balanced or accurate.`);
  }
  return known;
}

function readParseMode(value: unknown): ParseMode | undefined {
  const mode = datalabGuards.text(value)?.trim().toLowerCase();
  return PARSE_MODES.find((entry) => entry === mode);
}

function fieldsToSchema(fields: unknown): ExtractSchema {
  const rows = datalabGuards.list(fields);
  if (rows.length === 0) {
    throw new Error('Add at least one field under Fields to Extract, for example invoice_total.');
  }
  const seen = new Set<string>();
  const properties: Array<[string, Record<string, unknown>]> = [];
  const required: string[] = [];
  rows.forEach((row, index) => {
    const entry = datalabGuards.record(row) ?? {};
    const name = datalabGuards.text(entry['name'])?.trim();
    if (name === undefined) {
      throw new Error(`Field ${index + 1} under Fields to Extract has no name. Give every field a short name, for example invoice_total.`);
    }
    if (seen.has(name)) {
      throw new Error(`The field name "${name}" is used more than once under Fields to Extract. Give every field its own name.`);
    }
    seen.add(name);
    const type = FIELD_TYPES.find((fieldType) => fieldType === entry['type']) ?? 'string';
    const description = datalabGuards.text(entry['description'])?.trim();
    properties.push([name, description === undefined ? { type } : { type, description }]);
    if (entry['required'] === true) {
      required.push(name);
    }
  });
  const schema: ExtractSchema = { type: 'object', properties: Object.fromEntries(properties) };
  return required.length > 0 ? { ...schema, required } : schema;
}

function checkSchema(value: unknown): ExtractSchema {
  const parsed = typeof value === 'string' ? parseSchemaText(value) : value;
  if (parsed === undefined || parsed === null) {
    throw new Error(`Give the JSON Schema of the fields to extract, for example ${SCHEMA_EXAMPLE}.`);
  }
  const schema = datalabGuards.record(parsed);
  if (schema === undefined) {
    throw new Error(`The JSON Schema must be a JSON object, for example ${SCHEMA_EXAMPLE}.`);
  }
  if (schema['type'] !== undefined && schema['type'] !== 'object') {
    throw new Error(`The JSON Schema must describe an object: set "type" to "object" at the top level and list the fields under "properties", for example ${SCHEMA_EXAMPLE}.`);
  }
  const properties = datalabGuards.record(schema['properties']);
  if (properties === undefined || Object.keys(properties).length === 0) {
    throw new Error(`The JSON Schema needs a "properties" object at the top level with at least one field, for example ${SCHEMA_EXAMPLE}.`);
  }
  for (const [name, definition] of Object.entries(properties)) {
    if (!datalabGuards.isRecord(definition)) {
      throw new Error(`Field "${name}" in the JSON Schema must be an object, for example {"type": "string"}.`);
    }
  }
  return { ...schema, type: 'object', properties };
}

function parseSchemaText(text: string): unknown {
  if (text.trim().length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`The JSON Schema is not valid JSON (${reason}). Check for missing quotes, commas or brackets, for example ${SCHEMA_EXAMPLE}.`);
  }
}

function formFields(input: ExtractInput): Record<string, DatalabFormValue> {
  const turbo = input.extractionMode === 'turbo';
  return {
    page_schema: JSON.stringify(input.schema),
    extraction_mode: input.extractionMode,
    mode: turbo ? undefined : input.parseMode,
    citation_granularity: turbo ? undefined : input.citationGranularity,
    ...datalabProps.readPaging({ pageRange: input.pageRange, maxPages: input.maxPages }),
    skip_cache: input.skipCache,
  };
}

async function run({ apiKey, audience, input, timing }: ExtractRunParams): Promise<DatalabActionOutput<ExtractOutput>> {
  const body = datalabSource.newForm({ source: input.source, fields: formFields(input) });
  const outcome = await datalabClient.runJob({ apiKey, operation: 'extract', body, timing });
  return datalabClient.finish({ outcome, operation: 'extract', audience, shape: (result) => shape({ result, options: { schema: input.schema } }) });
}

function hasOutput(result: Record<string, unknown>): boolean {
  const extracted = result['extraction_schema_json'];
  return datalabGuards.isRecord(extracted) || datalabGuards.text(extracted) !== undefined;
}

async function shape({ result, options }: ExtractShapeParams): Promise<ExtractOutput> {
  const extracted = readExtraction(result['extraction_schema_json']);
  const extractionMode = datalabGuards.text(result['extraction_mode']) ?? null;
  const { data, citations, details } = extractionMode === 'turbo' ? { data: extracted, citations: {}, details: {} } : split({ extracted, schema: options?.schema });
  return {
    data,
    citations,
    details,
    score_average: datalabGuards.finiteNumber(result['extraction_score_average']) ?? null,
    extraction_mode: extractionMode,
    page_count: datalabGuards.finiteNumber(result['page_count']) ?? null,
  };
}

function readExtraction(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    throw new Error('Datalab finished the extraction but sent no extracted data. Check that the request came from Extract Structured Data, then run the step again.');
  }
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Datalab sent extracted data that is not valid JSON, so it could not be read. Run the step again; if it keeps happening, try another Extraction Mode.');
  }
}

function split({ extracted, schema }: { extracted: unknown; schema?: Record<string, unknown> }): ExtractSplit {
  const citations = new Map<string, unknown>();
  const details = new Map<string, Record<string, unknown>>();
  const data = walk({ value: extracted, schema, path: '', citations, details });
  return { data, citations: Object.fromEntries(citations), details: Object.fromEntries(details) };
}

function walk({ value, schema, path, citations, details }: WalkParams): unknown {
  if (Array.isArray(value)) {
    const itemSchema = datalabGuards.record(schema?.['items']);
    return value.map((item, index) => walk({ value: item, schema: itemSchema, path: `${path}[${index}]`, citations, details }));
  }
  if (!datalabGuards.isRecord(value)) {
    return value;
  }
  const declared = datalabGuards.record(schema?.['properties']);
  const kept: Array<[string, unknown]> = [];
  for (const [key, child] of Object.entries(value)) {
    const helper = helperOf({ key, siblings: value, declared });
    if (helper === undefined) {
      const childSchema = declared !== undefined && Object.hasOwn(declared, key) ? datalabGuards.record(declared[key]) : undefined;
      kept.push([key, walk({ value: child, schema: childSchema, path: joinPath({ path, key }), citations, details })]);
      continue;
    }
    const fieldPath = joinPath({ path, key: helper.base });
    if (helper.kind === 'citations') {
      citations.set(fieldPath, child);
      continue;
    }
    const detail = detailOf({ kind: helper.kind, value: child });
    if (detail !== undefined) {
      details.set(fieldPath, { ...details.get(fieldPath), ...detail });
    }
  }
  return Object.fromEntries(kept);
}

function detailOf({ kind, value }: { kind: HelperKind; value: unknown }): Record<string, unknown> | undefined {
  if (kind === 'meta') {
    return datalabGuards.record(value);
  }
  const scored = datalabGuards.record(value);
  if (scored !== undefined) {
    return { score: scored['score'] ?? null, score_reasoning: scored['reasoning'] ?? null };
  }
  return value === null || value === undefined ? undefined : { score: value };
}

function helperOf({ key, siblings, declared }: { key: string; siblings: Record<string, unknown>; declared: Record<string, unknown> | undefined }): { base: string; kind: HelperKind } | undefined {
  if (declared !== undefined && Object.hasOwn(declared, key)) {
    return undefined;
  }
  if (hasOwnHelpers({ key, siblings })) {
    return undefined;
  }
  for (const { suffix, kind } of HELPER_SUFFIXES) {
    if (key.length > suffix.length && key.endsWith(suffix)) {
      const base = key.slice(0, -suffix.length);
      if (Object.hasOwn(siblings, base) && fitsHelper({ kind, value: siblings[key] })) {
        return { base, kind };
      }
    }
  }
  return undefined;
}

function hasOwnHelpers({ key, siblings }: { key: string; siblings: Record<string, unknown> }): boolean {
  return Array.isArray(siblings[`${key}_citations`]) || datalabGuards.isRecord(siblings[`${key}_meta`]);
}

function fitsHelper({ kind, value }: { kind: HelperKind; value: unknown }): boolean {
  if (kind === 'citations') {
    return Array.isArray(value);
  }
  if (kind === 'meta') {
    return datalabGuards.isRecord(value);
  }
  if (value === null || datalabGuards.finiteNumber(value) !== undefined) {
    return true;
  }
  const scored = datalabGuards.record(value);
  return scored !== undefined && datalabGuards.finiteNumber(scored['score']) !== undefined;
}

function joinPath({ path, key }: { path: string; key: string }): string {
  return path.length === 0 ? key : `${path}.${key}`;
}

export const extractOperation = {
  outputSchema,
  humanProps,
  aiProps,
  readHuman,
  readAi,
  fieldsToSchema,
  checkSchema,
  formFields,
  run,
  hasOutput,
  shape,
  split,
};

export type ExtractionMode = 'turbo' | 'fast' | 'balanced' | 'accurate';

export type ParseMode = 'fast' | 'balanced' | 'accurate';

export type CitationGranularity = 'block' | 'phrase';

export type SchemaType = 'simple' | 'advanced';

export type SimpleFieldType = 'string' | 'number' | 'boolean';

export type ExtractSchema = Record<string, unknown> & { type: 'object'; properties: Record<string, unknown> };

export type ExtractInput = {
  source: DatalabSource;
  schema: ExtractSchema;
  extractionMode: ExtractionMode;
  parseMode: ParseMode | undefined;
  citationGranularity: CitationGranularity;
  pageRange: string | undefined;
  maxPages: number | undefined;
  skipCache: boolean;
};

export type ExtractSplit = {
  data: unknown;
  citations: Record<string, unknown>;
  details: Record<string, Record<string, unknown>>;
};

export type ExtractOutput = ExtractSplit & {
  score_average: number | null;
  extraction_mode: string | null;
  page_count: number | null;
};

export type ExtractShapeParams = {
  result: Record<string, unknown>;
  files?: FilesService;
  options?: ExtractShapeOptions;
};

export type ExtractShapeOptions = {
  schema?: Record<string, unknown>;
};

export type ExtractRunParams = {
  apiKey: string;
  audience: DatalabAudience;
  input: ExtractInput;
  timing?: DatalabTiming;
};

type CommonValues = {
  extraction_mode?: unknown;
  page_range?: unknown;
  max_pages?: unknown;
  citation_granularity?: unknown;
  skip_cache?: unknown;
};

type HumanValues = CommonValues & {
  source?: unknown;
  file?: unknown;
  file_url?: unknown;
  schema_type?: unknown;
  schema?: unknown;
  parse_mode?: unknown;
};

type AiValues = CommonValues & {
  file_url?: unknown;
  json_schema?: unknown;
};

type HelperKind = 'citations' | 'meta' | 'score';

type WalkParams = {
  value: unknown;
  schema: Record<string, unknown> | undefined;
  path: string;
  citations: Map<string, unknown>;
  details: Map<string, Record<string, unknown>>;
};
