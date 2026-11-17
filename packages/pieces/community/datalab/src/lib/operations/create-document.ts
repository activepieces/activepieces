import { FilesService, OutputSchema } from '@activepieces/pieces-framework';
import { datalabClient, DatalabActionOutput, DatalabAudience, DatalabOperation, DatalabTiming } from '../common/client';
import { datalabFiles } from '../common/files';
import { datalabGuards } from '../common/guards';
import { datalabProps } from '../common/props';

const OPERATION: DatalabOperation = 'create-document';
const OUTPUT_FORMAT = 'docx';
const DEFAULT_FILE_NAME = 'document';
const TIMEOUT_AUDIENCE: DatalabAudience = 'ai';
const DOCS_URL = 'https://documentation.datalab.to/docs/recipes/create-document/create-document-api-overview';

const outputSchema: OutputSchema = {
  fields: [
    ...datalabProps.envelopeFields(),
    {
      key: 'file',
      label: 'Word File',
      format: 'url',
      description: 'The Word (.docx) file, stored in Activepieces. Pass it to any step that takes a file. A saved file is limited to 10 MB on Activepieces Cloud.',
    },
    { key: 'file_name', label: 'File Name' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'page_count', label: 'Page Count', format: 'number' },
    { key: 'output_format', label: 'Output Format', description: 'Always docx.' },
  ],
};

function readMarkdown(value: unknown): string {
  const markdown = datalabGuards.text(value);
  if (markdown === undefined) {
    throw new Error('Give the Markdown text to turn into a Word document. The Markdown field is empty.');
  }
  return markdown;
}

function fileNameFor(value: unknown): string {
  return datalabFiles.withExtension({ fileName: value, extension: OUTPUT_FORMAT, fallback: DEFAULT_FILE_NAME });
}

function hasOutput(result: Record<string, unknown>): boolean {
  return datalabGuards.text(result['output_base64']) !== undefined && result['output_format'] === OUTPUT_FORMAT;
}

async function shape({ result, files, options }: ShapeParams): Promise<CreateDocumentOutput> {
  const base64 = datalabGuards.text(result['output_base64']);
  if (base64 === undefined) {
    throw new Error('Datalab finished the request but sent no Word file. If you used Get Result, check that the Request ID came from Create Document, then try again.');
  }
  const saved = await datalabFiles.saveBase64({ files, base64, fileName: fileNameFor(options?.fileName) });
  return {
    ...saved,
    page_count: datalabGuards.finiteNumber(result['page_count']) ?? null,
    output_format: datalabGuards.text(result['output_format']) ?? OUTPUT_FORMAT,
  };
}

async function run({ apiKey, files, markdown, fileName, timing }: RunParams): Promise<DatalabActionOutput<CreateDocumentOutput>> {
  const text = readMarkdown(markdown);
  const name = fileNameFor(fileName);
  const outcome = await datalabClient.runJob({ apiKey, operation: OPERATION, body: { markdown: text, output_format: OUTPUT_FORMAT }, timing });
  return datalabClient.finish({
    outcome,
    operation: OPERATION,
    audience: TIMEOUT_AUDIENCE,
    shape: (result) => shape({ result, files, options: { fileName: name } }),
  });
}

export const createDocumentOperation = { DOCS_URL, DEFAULT_FILE_NAME, outputSchema, hasOutput, shape, run };

export type CreateDocumentOutput = {
  file: string;
  file_name: string;
  size: number;
  page_count: number | null;
  output_format: string;
};

export type CreateDocumentShapeOptions = {
  fileName?: unknown;
};

type ShapeParams = {
  result: Record<string, unknown>;
  files: FilesService;
  options?: CreateDocumentShapeOptions;
};

type RunParams = {
  apiKey: string;
  files: FilesService;
  markdown: unknown;
  fileName: unknown;
  timing?: DatalabTiming;
};
