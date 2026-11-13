import { FilesService, OutputSchema, Property } from '@activepieces/pieces-framework';
import { DatalabActionOutput, DatalabAudience, datalabClient, DatalabTiming } from '../common/client';
import { datalabFiles, DatalabSavedFile } from '../common/files';
import { datalabGuards } from '../common/guards';
import { datalabProps } from '../common/props';
import { DatalabSource, datalabSource } from '../common/source';

const NOUN = 'document';
const FALLBACK_FILE_NAME = 'converted-document';
const INLINE_CONTENT_LIMIT_BYTES = 4_000_000;

const OUTPUT_FORMATS: ConvertOutputFormat[] = ['markdown', 'html', 'json', 'chunks'];
const MODES: ConvertMode[] = ['lite', 'fast', 'balanced', 'accurate'];
const EXTRAS: ConvertExtra[] = ['chart_understanding', 'extract_links', 'extract_bookmarks'];

const DEFAULT_OUTPUT_FORMAT: ConvertOutputFormat = 'markdown';
const DEFAULT_MODE: ConvertMode = 'balanced';

const FILE_EXTENSIONS: Record<ConvertOutputFormat, string> = {
  markdown: 'md',
  html: 'html',
  json: 'json',
  chunks: 'json',
};

const EXTRA_LABELS: Record<ConvertExtra, string> = {
  chart_understanding: 'Chart Understanding',
  extract_links: 'Extract Links',
  extract_bookmarks: 'Extract Bookmarks',
};

const SIZE_NOTE = 'JSON and Chunks get large on long documents (about 6 KB a page for JSON, and a step output is limited to 5 MB), so turn on Also Save as File or set a Page Range there.';
const FILE_LIMIT_NOTE = 'A saved file is limited to 10 MB on Activepieces Cloud.';

function humanProps() {
  return {
    ...datalabSource.humanProps({ noun: NOUN }),
    output_format: Property.StaticDropdown<ConvertOutputFormat, true>({
      displayName: 'Output Format',
      description: `Markdown is plain text with headings and tables, the best input for AI steps. HTML keeps more of the layout. JSON gives every block with its type and position on the page. Chunks gives a flat list of blocks, ready for a search index. ${SIZE_NOTE}`,
      required: true,
      defaultValue: DEFAULT_OUTPUT_FORMAT,
      options: {
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
          { label: 'JSON', value: 'json' },
          { label: 'Chunks', value: 'chunks' },
        ],
      },
    }),
    mode: Property.StaticDropdown<ConvertMode, true>({
      displayName: 'Mode',
      description: 'How hard Datalab works on the document. Faster modes cost fewer credits; Accurate is the slowest and costs the most.',
      display: 'cards',
      required: true,
      defaultValue: DEFAULT_MODE,
      options: {
        options: [
          { label: 'Lite', value: 'lite', description: 'Cheapest and fastest. No Exact Transcription or Extras.' },
          { label: 'Fast', value: 'fast', description: 'Quick and low cost, good for clean digital files.' },
          { label: 'Balanced', value: 'balanced', description: 'The default mix of speed, cost and accuracy.' },
          { label: 'Accurate', value: 'accurate', description: 'Most accurate, slowest and costs the most.' },
        ],
      },
    }),
    page_range: datalabProps.pageRange(),
    max_pages: datalabProps.maxPages(),
    paginate: Property.Checkbox({
      displayName: 'Page Separators',
      description: 'Turn on to put a line with the page number between pages, counted from 0.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    include_images: Property.Checkbox({
      displayName: 'Include Images',
      description: `Turn on to save the pictures found in the document as files, listed in Images. The Markdown and HTML point to them by file name. Off by default because Datalab sends every image inside the result, which makes it much larger. ${FILE_LIMIT_NOTE}`,
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    keep_headers_footers: Property.Checkbox({
      displayName: 'Keep Headers and Footers',
      description: 'Turn on to keep page headers and footers in Markdown and HTML. They are always kept in JSON and Chunks.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    exact_transcription: Property.Checkbox({
      displayName: 'Exact Transcription',
      description: 'Turn on to keep the text exactly as printed, typos and odd formatting included. Not available in Lite mode.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    token_efficient_markdown: Property.Checkbox({
      displayName: 'Token-Efficient Markdown',
      description: 'Turn on for shorter Markdown that uses fewer AI tokens, for example when the next step is an AI model.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    extras: Property.StaticMultiSelectDropdown<ConvertExtra, false>({
      displayName: 'Extras',
      description: 'Extra processing: Chart Understanding reads the data out of charts, Extract Links keeps the links in the document, Extract Bookmarks lists the PDF bookmarks. Not available in Lite mode.',
      required: false,
      advanced: true,
      options: {
        options: EXTRAS.map((extra) => ({ label: EXTRA_LABELS[extra], value: extra })),
      },
    }),
    skip_cache: datalabProps.skipCache(),
    save_as_file: Property.Checkbox({
      displayName: 'Also Save as File',
      description: `Turn on to also save the result as a file (.md, .html or .json) that later steps can use. Use it for long documents. When the result is over 4 MB it is returned only as the file. ${FILE_LIMIT_NOTE}`,
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  };
}

function aiProps() {
  return {
    ...datalabSource.aiProps({ noun: NOUN }),
    output_format: Property.StaticDropdown<ConvertOutputFormat, false>({
      displayName: 'Output Format',
      description:
        'One of markdown, html, json or chunks. Default markdown, the best choice for reading the text. html keeps more layout, json is a block tree with positions, chunks is a flat list of blocks. json and chunks get large (about 6 KB a page for json; output is limited to 5 MB), so set page_range or save_as_file on long documents.',
      required: false,
      options: {
        options: OUTPUT_FORMATS.map((format) => ({ label: format, value: format })),
      },
    }),
    mode: Property.StaticDropdown<ConvertMode, false>({
      displayName: 'Mode',
      description: 'One of lite, fast, balanced or accurate. Default balanced. lite is the cheapest and fastest but rejects exact_transcription and extras; accurate is the slowest, costs the most and is the most accurate.',
      required: false,
      options: {
        options: MODES.map((mode) => ({ label: mode, value: mode })),
      },
    }),
    page_range: Property.ShortText({
      displayName: 'Page Range',
      description: 'Pages to convert, counted from 0, with commas and ranges, for example 0,5-10,20. Leave empty for the whole document.',
      required: false,
    }),
    max_pages: Property.Number({
      displayName: 'Max Pages',
      description: 'Stop after this many pages from the start, a whole number of 1 or more. Leave empty for no limit. page_range wins when both are set.',
      required: false,
    }),
    paginate: Property.Checkbox({
      displayName: 'Page Separators',
      description: 'true puts a line with the page number (counted from 0) between pages. Default false.',
      required: false,
    }),
    include_images: Property.Checkbox({
      displayName: 'Include Images',
      description: 'true saves the pictures in the document as files, listed in images. Default false, which keeps the output small.',
      required: false,
    }),
    keep_headers_footers: Property.Checkbox({
      displayName: 'Keep Headers and Footers',
      description: 'true keeps page headers and footers in markdown and html. Default false. json and chunks always keep them.',
      required: false,
    }),
    exact_transcription: Property.Checkbox({
      displayName: 'Exact Transcription',
      description: 'true keeps the text exactly as printed, typos included. Default false. Not allowed with mode lite.',
      required: false,
    }),
    token_efficient_markdown: Property.Checkbox({
      displayName: 'Token-Efficient Markdown',
      description: 'true returns shorter markdown that uses fewer tokens. Default false.',
      required: false,
    }),
    extras: Property.StaticMultiSelectDropdown<ConvertExtra, false>({
      displayName: 'Extras',
      description: 'Any of chart_understanding (read data out of charts), extract_links (keep links), extract_bookmarks (list PDF bookmarks). Leave empty for none. Not allowed with mode lite.',
      required: false,
      options: {
        options: EXTRAS.map((extra) => ({ label: extra, value: extra })),
      },
    }),
    skip_cache: Property.Checkbox({
      displayName: 'Skip Cache',
      description: 'true processes the document again even if Datalab already has a result for the same file and options, and bills it again. Default false.',
      required: false,
    }),
    save_as_file: Property.Checkbox({
      displayName: 'Also Save as File',
      description: 'true also saves the result as a .md, .html or .json file and returns its link in file. Default false. Use it for long documents; a result over 4 MB is returned only as the file. A saved file is limited to 10 MB on Activepieces Cloud.',
      required: false,
    }),
  };
}

function readOptions({ values, audience, source }: { values: Record<string, unknown>; audience: DatalabAudience; source: DatalabSource }): ConvertOptions {
  const options: ConvertOptions = {
    outputFormat: readChoice({ value: values['output_format'], allowed: OUTPUT_FORMATS, fallback: DEFAULT_OUTPUT_FORMAT, name: audience === 'ai' ? 'output_format' : 'Output Format' }),
    mode: readChoice({ value: values['mode'], allowed: MODES, fallback: DEFAULT_MODE, name: audience === 'ai' ? 'mode' : 'Mode' }),
    pageRange: datalabProps.readPageRange(values['page_range']),
    maxPages: datalabProps.readMaxPages(values['max_pages']),
    paginate: values['paginate'] === true,
    includeImages: values['include_images'] === true,
    keepHeadersFooters: values['keep_headers_footers'] === true,
    exactTranscription: values['exact_transcription'] === true,
    tokenEfficientMarkdown: values['token_efficient_markdown'] === true,
    extras: readExtras({ value: values['extras'], audience }),
    skipCache: values['skip_cache'] === true,
    saveAsFile: values['save_as_file'] === true,
    fileName: baseFileName(source),
  };
  assertModeSupports({ options, audience });
  return options;
}

function toFields(options: ConvertOptions): Parameters<typeof datalabSource.newForm>[0]['fields'] {
  return {
    mode: options.mode,
    output_format: options.outputFormat,
    disable_image_extraction: !options.includeImages,
    ...datalabProps.readPaging({ pageRange: options.pageRange, maxPages: options.maxPages }),
    paginate: options.paginate ? true : undefined,
    exact_transcription: options.exactTranscription ? true : undefined,
    token_efficient_markdown: options.tokenEfficientMarkdown ? true : undefined,
    additional_config: options.keepHeadersFooters ? { keep_pageheader_in_output: true, keep_pagefooter_in_output: true } : undefined,
    extras: options.extras.length > 0 ? options.extras.join(',') : undefined,
    skip_cache: options.skipCache ? true : undefined,
  };
}

async function run({ apiKey, source, values, audience, files, timing }: ConvertRunParams): Promise<DatalabActionOutput<ConvertOutput>> {
  const options = readOptions({ values, audience, source });
  const body = datalabSource.newForm({ source, fields: toFields(options) });
  const outcome = await datalabClient.runJob({ apiKey, operation: 'convert', body, timing });
  return datalabClient.finish({
    outcome,
    operation: 'convert',
    audience,
    shape: (result) => shape({ result, files, options }),
  });
}

async function shape({ result, files, options }: { result: Record<string, unknown>; files: FilesService; options?: ConvertShapeOptions }): Promise<ConvertOutput> {
  const outputFormat = options?.outputFormat ?? formatOf(result);
  const saved = new Map<string, DatalabSavedFile>();
  await saveImageMap({ images: datalabGuards.record(result['images']), saved, files });
  const content = await replaceNestedImages({ value: readContent({ result, outputFormat }), saved, files });
  const metadata = datalabGuards.record(result['metadata']);
  const output: ConvertOutput = {
    output_format: outputFormat,
    content,
    page_count: datalabGuards.finiteNumber(result['page_count']) ?? null,
    parse_quality_score: datalabGuards.finiteNumber(result['parse_quality_score']) ?? null,
    failed_pages: datalabGuards.numberList(metadata?.['failed_pages']),
    bookmarks: metadata?.['pdf_bookmarks'] ?? null,
    images: [...saved.values()],
    file: null,
    file_name: null,
    size: null,
  };
  if (options?.saveAsFile !== true || content === null) {
    return output;
  }
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  const file = await datalabFiles.saveText({
    files,
    text,
    fileName: datalabFiles.withExtension({ fileName: options.fileName, extension: FILE_EXTENSIONS[outputFormat], fallback: FALLBACK_FILE_NAME }),
  });
  return {
    ...output,
    content: Buffer.byteLength(text, 'utf8') > INLINE_CONTENT_LIMIT_BYTES ? null : content,
    ...file,
  };
}

function hasOutput(result: Record<string, unknown>): boolean {
  return OUTPUT_FORMATS.some((format) => result[format] !== null && result[format] !== undefined);
}

function readChoice<T extends string>({ value, allowed, fallback, name }: { value: unknown; allowed: T[]; fallback: T; name: string }): T {
  const given = datalabGuards.text(value)?.trim().toLowerCase();
  if (given === undefined) {
    return fallback;
  }
  const match = allowed.find((entry) => entry === given);
  if (match === undefined) {
    throw new Error(`${name} "${given}" is not supported. Use one of: ${allowed.join(', ')}.`);
  }
  return match;
}

function readExtras({ value, audience }: { value: unknown; audience: DatalabAudience }): ConvertExtra[] {
  const given = typeof value === 'string' ? value.split(',') : datalabGuards.textList(value);
  const extras: ConvertExtra[] = [];
  for (const entry of given.map((item) => item.trim().toLowerCase()).filter((item) => item.length > 0)) {
    const match = EXTRAS.find((extra) => extra === entry);
    if (match === undefined) {
      throw new Error(`${audience === 'ai' ? 'extras' : 'Extras'} "${entry}" is not supported. Use any of: ${EXTRAS.join(', ')}.`);
    }
    if (!extras.includes(match)) {
      extras.push(match);
    }
  }
  return extras;
}

function assertModeSupports({ options, audience }: { options: ConvertOptions; audience: DatalabAudience }): void {
  if (options.mode !== 'lite') {
    return;
  }
  const blocked: Array<{ name: string; fix: string }> = [];
  if (options.exactTranscription) {
    blocked.push(audience === 'ai' ? { name: 'exact_transcription', fix: 'set exact_transcription to false' } : { name: 'Exact Transcription', fix: 'turn off Exact Transcription' });
  }
  if (options.extras.length > 0) {
    blocked.push(audience === 'ai' ? { name: 'extras', fix: 'leave extras empty' } : { name: 'Extras', fix: 'clear Extras' });
  }
  if (blocked.length === 0) {
    return;
  }
  const names = blocked.map((entry) => entry.name).join(' and ');
  const fixes = blocked.map((entry) => entry.fix).join(' and ');
  if (audience === 'ai') {
    throw new Error(`mode lite does not support ${names}. Either ${fixes}, or use mode fast, balanced or accurate.`);
  }
  throw new Error(`Lite mode does not support ${names}. Either ${fixes}, or pick Fast, Balanced or Accurate as the Mode.`);
}

function formatOf(result: Record<string, unknown>): ConvertOutputFormat {
  const echoed = datalabGuards
    .text(result['output_format'])
    ?.split(',')
    .map((entry) => entry.trim().toLowerCase());
  const named = OUTPUT_FORMATS.find((format) => echoed?.[0] === format && result[format] !== null && result[format] !== undefined);
  if (named !== undefined) {
    return named;
  }
  return OUTPUT_FORMATS.find((format) => result[format] !== null && result[format] !== undefined) ?? DEFAULT_OUTPUT_FORMAT;
}

function readContent({ result, outputFormat }: { result: Record<string, unknown>; outputFormat: ConvertOutputFormat }): unknown {
  const value = result[outputFormat];
  if (value === undefined || value === null) {
    return null;
  }
  if ((outputFormat === 'json' || outputFormat === 'chunks') && typeof value === 'string') {
    return datalabGuards.parseJsonText(value) ?? value;
  }
  return value;
}

async function saveImageMap({ images, saved, files }: { images: Record<string, unknown> | undefined; saved: Map<string, DatalabSavedFile>; files: FilesService }): Promise<Record<string, unknown>> {
  const linked: Record<string, unknown> = {};
  for (const [name, data] of Object.entries(images ?? {})) {
    const base64 = datalabGuards.text(data);
    if (base64 === undefined) {
      linked[name] = data;
      continue;
    }
    const existing = saved.get(name);
    const file = existing ?? (await datalabFiles.saveBase64({ files, base64, fileName: name }));
    saved.set(name, file);
    linked[name] = file.file;
  }
  return linked;
}

async function replaceNestedImages({ value, saved, files }: { value: unknown; saved: Map<string, DatalabSavedFile>; files: FilesService }): Promise<unknown> {
  if (Array.isArray(value)) {
    const items: unknown[] = [];
    for (const item of value) {
      items.push(await replaceNestedImages({ value: item, saved, files }));
    }
    return items;
  }
  const node = datalabGuards.record(value);
  if (node === undefined) {
    return value;
  }
  const copy: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(node)) {
    const images = key === 'images' ? datalabGuards.record(child) : undefined;
    copy[key] = images === undefined ? await replaceNestedImages({ value: child, saved, files }) : await saveImageMap({ images, saved, files });
  }
  return copy;
}

function baseFileName(source: DatalabSource): string | undefined {
  if (source.type === 'file') {
    return source.filename;
  }
  const path = source.url.split(/[?#]/)[0] ?? '';
  const last = path.slice(path.lastIndexOf('/') + 1);
  return /^[^.]+\.[A-Za-z]{2,5}$/.test(last) ? last : undefined;
}

const savedFileFields: OutputSchema['fields'] = [
  { key: 'file', label: 'File', format: 'url', description: 'The file stored in Activepieces. Pass it to any step that takes a file.' },
  { key: 'file_name', label: 'File Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
];

const outputSchema: OutputSchema = {
  fields: [
    ...datalabProps.envelopeFields(),
    { key: 'output_format', label: 'Output Format', description: 'markdown, html, json or chunks: the format of Content.' },
    {
      key: 'content',
      label: 'Content',
      description: 'The converted document: text for Markdown and HTML, an object for JSON and Chunks. Empty when Also Save as File is on and the result is over 4 MB; use File then.',
    },
    { key: 'page_count', label: 'Page Count', format: 'number' },
    { key: 'parse_quality_score', label: 'Parse Quality Score', format: 'number', description: 'Datalab quality score from 0 to 5. Often empty in Fast mode.' },
    { key: 'failed_pages', label: 'Failed Pages', description: 'Pages Datalab could not read, counted from 0.' },
    { key: 'bookmarks', label: 'Bookmarks', description: 'The PDF bookmarks, when Extract Bookmarks is on.' },
    {
      key: 'images',
      label: 'Images',
      labelKey: 'file_name',
      description: 'Pictures saved from the document when Include Images is on. The Markdown and HTML refer to them by file name.',
      listItems: savedFileFields,
    },
    { key: 'file', label: 'File', format: 'url', description: 'The result saved as a file, only when Also Save as File is on.' },
    { key: 'file_name', label: 'File Name' },
    { key: 'size', label: 'File Size', format: 'filesize' },
  ],
};

export const convertOperation = {
  OUTPUT_FORMATS,
  MODES,
  EXTRAS,
  humanProps,
  aiProps,
  readOptions,
  toFields,
  run,
  shape,
  hasOutput,
  outputSchema,
};

export type ConvertOutputFormat = 'markdown' | 'html' | 'json' | 'chunks';

export type ConvertMode = 'lite' | 'fast' | 'balanced' | 'accurate';

export type ConvertExtra = 'chart_understanding' | 'extract_links' | 'extract_bookmarks';

export type ConvertOptions = {
  outputFormat: ConvertOutputFormat;
  mode: ConvertMode;
  pageRange: string | undefined;
  maxPages: number | undefined;
  paginate: boolean;
  includeImages: boolean;
  keepHeadersFooters: boolean;
  exactTranscription: boolean;
  tokenEfficientMarkdown: boolean;
  extras: ConvertExtra[];
  skipCache: boolean;
  saveAsFile: boolean;
  fileName: string | undefined;
};

export type ConvertShapeOptions = Partial<Pick<ConvertOptions, 'outputFormat' | 'saveAsFile' | 'fileName'>>;

export type ConvertOutput = {
  output_format: ConvertOutputFormat;
  content: unknown;
  page_count: number | null;
  parse_quality_score: number | null;
  failed_pages: number[];
  bookmarks: unknown;
  images: DatalabSavedFile[];
  file: string | null;
  file_name: string | null;
  size: number | null;
};

type ConvertRunParams = {
  apiKey: string;
  source: DatalabSource;
  values: Record<string, unknown>;
  audience: DatalabAudience;
  files: FilesService;
  timing?: DatalabTiming;
};
