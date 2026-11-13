import { FilesService, OutputSchema, Property } from '@activepieces/pieces-framework';
import { datalabClient, DatalabActionOutput, DatalabAudience, DatalabTiming } from '../common/client';
import { datalabGuards } from '../common/guards';
import { datalabProps } from '../common/props';
import { datalabSource, DatalabSource } from '../common/source';

const MAX_INSTRUCTIONS_LENGTH = 4_000;
const DETAIL_LEVELS: readonly SegmentDetailLevel[] = ['pages', 'pages_with_content', 'blocks'];
const MODES: readonly SegmentMode[] = ['fast', 'balanced', 'accurate'];

const DETAIL_LEVEL_OPTIONS: Array<{ label: string; value: SegmentDetailLevel }> = [
  { label: 'Pages only', value: 'pages' },
  { label: 'Pages with content', value: 'pages_with_content' },
  { label: 'Block level', value: 'blocks' },
];

const MODE_OPTIONS: Array<{ label: string; value: SegmentMode }> = [
  { label: 'Fast', value: 'fast' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Accurate', value: 'accurate' },
];

const outputSchema: OutputSchema = {
  fields: [
    ...datalabProps.envelopeFields(),
    {
      key: 'segments',
      label: 'Segments',
      labelKey: 'name',
      description: 'One item per document or section found, in page order. Every item has the same keys.',
      listItems: [
        { key: 'name', label: 'Name', description: 'The section name you gave, or the title Datalab gave a detected document.' },
        { key: 'pages', label: 'Pages', description: 'The page numbers of this part, counted from 0.' },
        { key: 'first_page', label: 'First Page', format: 'number', description: 'The first page of this part, counted from 0.' },
        { key: 'last_page', label: 'Last Page', format: 'number', description: 'The last page of this part, counted from 0.' },
        { key: 'confidence', label: 'Confidence', description: 'How sure Datalab is about this part, for example high or medium.' },
        { key: 'segment_type', label: 'Segment Type', description: 'The kind of document, for example invoice or contract. Only set at Block level, otherwise empty.' },
        { key: 'start_block_page', label: 'Start Block Page', format: 'number', description: 'Block level only: the page where this part starts, counted from 0.' },
        { key: 'start_block_index', label: 'Start Block Index', format: 'number', description: 'Block level only: the block on that page where this part starts, counted from 0.' },
        { key: 'end_block_page', label: 'End Block Page', format: 'number', description: 'Block level only: the page where this part ends, counted from 0.' },
        { key: 'end_block_index', label: 'End Block Index', format: 'number', description: 'Block level only: the block on that page where this part ends, counted from 0.' },
      ],
    },
    { key: 'segment_count', label: 'Segment Count', format: 'number', description: 'How many parts were found.' },
    { key: 'total_pages', label: 'Total Pages', format: 'number', description: 'How many pages Datalab looked at.' },
    { key: 'method', label: 'Method', description: 'How Datalab split the document, for example document_boundary, find or block_boundary.' },
    { key: 'missing_sections', label: 'Missing Sections', description: 'Named sections that Datalab could not find in the document. Empty with automatic detection.' },
    { key: 'unassigned_pages', label: 'Unassigned Pages', description: 'Pages, counted from 0, that belong to none of the named sections.' },
  ],
};

function humanProps() {
  return {
    ...datalabSource.humanProps({ noun: 'document' }),
    split_method: Property.StaticDropdown<SegmentMethod, true>({
      displayName: 'How to Split',
      description: 'Detect Documents finds where each separate document starts in a combined file. Named Sections finds the sections you list in Sections.',
      display: 'cards',
      required: true,
      defaultValue: 'automatic',
      options: {
        options: [
          { label: 'Detect Documents', value: 'automatic', description: 'Find where each document starts, for example in a scanned batch.', icon: 'file' },
          { label: 'Named Sections', value: 'sections', description: 'Find the sections you list, such as Invoice or Contract.', icon: 'tag' },
        ],
      },
    }),
    sections: Property.Array({
      displayName: 'Sections',
      description: 'The sections to find, each with a name and an optional description that helps Datalab recognise it, for example Invoice: the invoice and its payment terms. Needed when How to Split is Named Sections. Sections that Datalab cannot find come back in Missing Sections.',
      required: false,
      properties: {
        name: Property.ShortText({ displayName: 'Name', description: 'A unique name for the section, for example Invoice.', required: true }),
        description: Property.ShortText({ displayName: 'Description', description: 'What the section contains, for example The invoice and its payment terms.', required: false }),
      },
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'Hints for Detect Documents, up to 4,000 characters, for example Split wherever a new invoice starts. Not used with Named Sections: describe each section in Sections instead.',
      required: false,
      advanced: true,
    }),
    detail_level: Property.StaticDropdown<SegmentDetailLevel, false>({
      displayName: 'Detail Level',
      description:
        'Pages only returns the pages of each part and is the cheapest level; it works with Detect Documents only. Pages with content and Block level also convert the document, so they cost more. Block level can split in the middle of a page and returns where each part starts and ends. Leave empty for Pages only with Detect Documents and Pages with content with Named Sections. Pages are counted from 0.',
      required: false,
      advanced: true,
      options: { options: DETAIL_LEVEL_OPTIONS },
    }),
    mode: Property.StaticDropdown<SegmentMode, false>({
      displayName: 'Mode',
      description: 'How carefully Datalab reads the document. Fast is quickest. Balanced and Accurate are slower and spend more credits. Default Fast.',
      required: false,
      defaultValue: 'fast',
      advanced: true,
      options: { options: MODE_OPTIONS },
    }),
    page_range: datalabProps.pageRange(),
    max_pages: datalabProps.maxPages(),
    skip_cache: datalabProps.skipCache(),
  };
}

function aiProps() {
  return {
    ...datalabSource.aiProps({ noun: 'document' }),
    sections: Property.Array({
      displayName: 'Sections',
      description:
        'Named sections to find, each with a unique name and an optional description, for example name Invoice, description The invoice and its payment terms. With entries, Datalab looks for these sections and lists the ones it cannot find in missing_sections. Leave empty to detect where each separate document starts.',
      required: false,
      properties: {
        name: Property.ShortText({ displayName: 'Name', description: 'Unique section name, for example Invoice.', required: true }),
        description: Property.ShortText({ displayName: 'Description', description: 'What the section contains.', required: false }),
      },
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'Optional hints for automatic detection (when sections is empty), up to 4,000 characters, for example Split wherever a new invoice starts. Ignored when sections has entries.',
      required: false,
    }),
    detail_level: Property.StaticDropdown<SegmentDetailLevel, false>({
      displayName: 'Detail Level',
      description:
        'pages returns only the pages of each part and is the cheapest; it works only when sections is empty. pages_with_content and blocks also convert the document and cost more; blocks can split mid-page and returns start and end block positions. Omit for pages when sections is empty and pages_with_content when it has entries. Pages are counted from 0.',
      required: false,
      options: { options: DETAIL_LEVEL_OPTIONS },
    }),
    mode: Property.StaticDropdown<SegmentMode, false>({
      displayName: 'Mode',
      description: 'fast, balanced or accurate. Slower modes read more carefully and spend more credits. Default fast.',
      required: false,
      options: { options: MODE_OPTIONS },
    }),
    page_range: datalabProps.pageRange(),
    max_pages: datalabProps.maxPages(),
    skip_cache: datalabProps.skipCache(),
  };
}

async function run({ apiKey, source, method, sections, instructions, detailLevel, mode, pageRange, maxPages, skipCache, audience, timing }: SegmentRunParams): Promise<DatalabActionOutput<SegmentOutput>> {
  const schema = buildRequestSchema({ method, sections, instructions, detailLevel });
  const fields = {
    segmentation_schema: JSON.stringify(schema),
    mode: readMode(mode),
    ...datalabProps.readPaging({ pageRange, maxPages }),
    skip_cache: skipCache === true,
  };
  const body = datalabSource.newForm({ source, fields });
  const outcome = await datalabClient.runJob({ apiKey, operation: 'segment', body, timing });
  return datalabClient.finish({ outcome, operation: 'segment', audience, shape: (result) => shape({ result }) });
}

function buildRequestSchema({ method, sections, instructions, detailLevel }: { method: unknown; sections: unknown; instructions: unknown; detailLevel: unknown }): Record<string, unknown> {
  const chosen = readMethod({ method, sections });
  return buildSchema({
    method: chosen,
    sections: chosen === 'sections' ? readSections(sections) : [],
    instructions: readInstructions(instructions),
    detailLevel: readDetailLevel(detailLevel),
  });
}

function buildSchema({ method, sections, instructions, detailLevel }: SegmentSchemaInput): Record<string, unknown> {
  if (instructions !== undefined && instructions.length > MAX_INSTRUCTIONS_LENGTH) {
    throw new Error(`Instructions are ${instructions.length.toLocaleString('en-US')} characters long. Datalab accepts up to 4,000. Shorten Instructions.`);
  }
  if (method === 'sections') {
    if (sections.length === 0) {
      throw new Error('Add at least one section to Sections, or set How to Split to Detect Documents.');
    }
    if (detailLevel === 'pages') {
      throw new Error('Detail Level "Pages only" works only with Detect Documents. With Named Sections, set Detail Level to Pages with content or Block level, or leave it empty.');
    }
    const schema: Record<string, unknown> = {
      segmentation_strategy: 'custom',
      segments: sections.map((section) => (section.description === undefined ? { name: section.name } : { name: section.name, description: section.description })),
    };
    if (detailLevel === 'blocks') {
      schema['granularity'] = 'block';
    }
    return schema;
  }
  const schema: Record<string, unknown> = { segmentation_strategy: 'document_boundary' };
  if (detailLevel === undefined || detailLevel === 'pages') {
    schema['granularity'] = 'page';
  }
  if (detailLevel === 'blocks') {
    schema['granularity'] = 'block';
  }
  if (instructions !== undefined) {
    schema['prompt'] = instructions;
  }
  return schema;
}

function readMethod({ method, sections }: { method: unknown; sections: unknown }): SegmentMethod {
  if (method === 'automatic' || method === 'sections') {
    return method;
  }
  return datalabGuards.list(sections).length > 0 ? 'sections' : 'automatic';
}

function readSections(value: unknown): SegmentSection[] {
  const sections: SegmentSection[] = [];
  const seen = new Set<string>();
  datalabGuards.list(value).forEach((entry, index) => {
    const row = datalabGuards.record(entry);
    const name = (typeof entry === 'string' ? entry : datalabGuards.text(row?.['name']))?.trim() ?? '';
    if (name.length === 0) {
      throw new Error(`Section ${index + 1} in Sections has no name. Give every section a name, or remove the empty row.`);
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`The section name "${name}" is used more than once in Sections. Give every section a different name.`);
    }
    seen.add(key);
    const description = datalabGuards.text(row?.['description'])?.trim();
    sections.push(description === undefined ? { name } : { name, description });
  });
  return sections;
}

function readInstructions(value: unknown): string | undefined {
  return datalabGuards.text(value)?.trim();
}

function readDetailLevel(value: unknown): SegmentDetailLevel | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const level = DETAIL_LEVELS.find((entry) => entry === value);
  if (level === undefined) {
    throw new Error(`Detail Level "${String(value)}" is not valid. Use pages, pages_with_content or blocks, or leave it empty.`);
  }
  return level;
}

function readMode(value: unknown): SegmentMode {
  if (value === undefined || value === null || value === '') {
    return 'fast';
  }
  const mode = MODES.find((entry) => entry === value);
  if (mode === undefined) {
    throw new Error(`Mode "${String(value)}" is not valid. Use fast, balanced or accurate.`);
  }
  return mode;
}

function shape({ result }: { result: Record<string, unknown>; files?: FilesService }): SegmentOutput {
  const segmentation = datalabGuards.record(result['segmentation_results']);
  const metadata = datalabGuards.record(segmentation?.['metadata']);
  const outerMetadata = datalabGuards.record(result['metadata']);
  const segments = datalabGuards
    .list(segmentation?.['segments'])
    .map((entry) => datalabGuards.record(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== undefined)
    .map(toSegment);
  return {
    segments,
    segment_count: segments.length,
    total_pages: datalabGuards.finiteNumber(metadata?.['total_pages']) ?? datalabGuards.finiteNumber(outerMetadata?.['total_pages']) ?? datalabGuards.finiteNumber(result['page_count']) ?? null,
    method: datalabGuards.text(metadata?.['segmentation_method']) ?? null,
    missing_sections: datalabGuards
      .list(metadata?.['missing_segments'])
      .map((entry) => (typeof entry === 'string' ? datalabGuards.text(entry) : datalabGuards.text(datalabGuards.record(entry)?.['name'])))
      .filter((entry): entry is string => entry !== undefined),
    unassigned_pages: datalabGuards.numberList(metadata?.['unassigned_pages']),
  };
}

function toSegment(segment: Record<string, unknown>): SegmentItem {
  const pages = datalabGuards.numberList(segment['pages']);
  const start = datalabGuards.record(segment['start_block']);
  const end = datalabGuards.record(segment['end_block']);
  return {
    name: datalabGuards.text(segment['name']) ?? null,
    pages,
    first_page: pages.length > 0 ? Math.min(...pages) : null,
    last_page: pages.length > 0 ? Math.max(...pages) : null,
    confidence: datalabGuards.text(segment['confidence']) ?? null,
    segment_type: datalabGuards.text(segment['segment_type']) ?? null,
    start_block_page: datalabGuards.finiteNumber(start?.['page_id']) ?? null,
    start_block_index: datalabGuards.finiteNumber(start?.['block_id']) ?? null,
    end_block_page: datalabGuards.finiteNumber(end?.['page_id']) ?? null,
    end_block_index: datalabGuards.finiteNumber(end?.['block_id']) ?? null,
  };
}

function hasOutput(result: Record<string, unknown>): boolean {
  const segmentation = result['segmentation_results'];
  return segmentation !== undefined && segmentation !== null;
}

export const segmentOperation = {
  MAX_INSTRUCTIONS_LENGTH,
  outputSchema,
  humanProps,
  aiProps,
  run,
  buildSchema,
  buildRequestSchema,
  readSections,
  shape,
  hasOutput,
};

export type SegmentMethod = 'automatic' | 'sections';

export type SegmentDetailLevel = 'pages' | 'pages_with_content' | 'blocks';

export type SegmentMode = 'fast' | 'balanced' | 'accurate';

export type SegmentSection = { name: string; description?: string };

export type SegmentSchemaInput = {
  method: SegmentMethod;
  sections: SegmentSection[];
  instructions?: string;
  detailLevel?: SegmentDetailLevel;
};

export type SegmentItem = {
  name: string | null;
  pages: number[];
  first_page: number | null;
  last_page: number | null;
  confidence: string | null;
  segment_type: string | null;
  start_block_page: number | null;
  start_block_index: number | null;
  end_block_page: number | null;
  end_block_index: number | null;
};

export type SegmentOutput = {
  segments: SegmentItem[];
  segment_count: number;
  total_pages: number | null;
  method: string | null;
  missing_sections: string[];
  unassigned_pages: number[];
};

export type SegmentRunParams = {
  apiKey: string;
  source: DatalabSource;
  method?: unknown;
  sections: unknown;
  instructions: unknown;
  detailLevel: unknown;
  mode: unknown;
  pageRange: unknown;
  maxPages: unknown;
  skipCache: unknown;
  audience: DatalabAudience;
  timing?: DatalabTiming;
};
