import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iloveSchemas } from '../common/schemas';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreWithBuffer } from '../common/runner';

export const extractTextPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'extract_text_pdf',
  classification: 'READ',
  displayName: 'Extract Text from PDF',
  description:
    'Extract plain or detailed text (with positions and font metadata) from a PDF.',
  audience: 'both',
  outputSchema: iloveSchemas.extractText,
  aiMetadata: {
    description:
      'Extract the text content of a PDF via the iLoveAPI service. Pick this to pull readable text out of a PDF (e.g. for parsing or downstream analysis); enable detailed mode when you need per-block positional and font metadata for layout-aware parsing rather than plain text. Each call re-runs extraction (spending credits) and writes a fresh output file; inline text is capped at 200,000 characters, the full text stays in the output file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    detailed: Property.Checkbox({
      displayName: 'Detailed Output',
      description:
        'Include positional and font metadata for each text block. Useful for downstream layout-aware parsing.',
      required: false,
      defaultValue: false,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, detailed, output_filename, packaged_filename } =
      context.propsValue;
    const wantDetailed = detailed === true;

    const { output: stored, buffer } = await runAndStoreWithBuffer({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'extract',
      uploads: [fileToUploadInput({ file: file, label: 'PDF File' })],
      options: { detailed: wantDetailed },
      output_filename,
      packaged_filename,
    });

    const fullText = decodeText(buffer);
    const text = fullText.length > MAX_INLINE_TEXT ? fullText.slice(0, MAX_INLINE_TEXT) : fullText;
    const parsed = wantDetailed ? parseDetailed(fullText) : undefined;
    return {
      ...stored,
      text,
      text_length: fullText.length,
      text_truncated: fullText.length > MAX_INLINE_TEXT,
      ...(parsed ? parsed : {}),
    };
  },
});

function decodeText(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.subarray(2));
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf-8');
  }
  return buffer.toString('utf-8');
}

function parseDetailed(text: string): { detailed: Array<Record<string, string | number>>; detailed_total_rows?: number; detailed_truncated?: boolean } | { detailed: null; detailed_parse_error: string } {
  const trimmed = text.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const json: unknown = JSON.parse(trimmed);
      if (Array.isArray(json)) {
        return { detailed: json.filter((row): row is Record<string, string | number> => row !== null && typeof row === 'object') };
      }
    } catch (error) {
      return { detailed: null, detailed_parse_error: `Detailed output is not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    return { detailed: [] };
  }
  const header = lines[0].split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const wordIndex = header.length - 1;
  if (header.length < 2 || !['Text', 'Word'].includes(header[wordIndex]) || header[0] !== 'PageNo') {
    return {
      detailed: null,
      detailed_parse_error: `Detailed output has an unexpected header: ${lines[0].slice(0, 200)}. The full result is in the output file.`,
    };
  }
  const rows = lines.slice(1, MAX_DETAILED_ROWS + 1).map((line) => line.replace(/\r$/, '')).map((line) => {
    const cells = line.split(',');
    const fixed = cells.slice(0, wordIndex);
    const word = cells.slice(wordIndex).join(',').trim().replace(/^"|"$/g, '');
    const row: Record<string, string | number> = {};
    header.slice(0, wordIndex).forEach((name, index) => {
      const raw = (fixed[index] ?? '').trim().replace(/^"|"$/g, '');
      const numeric = Number(raw);
      row[name] = raw !== '' && Number.isFinite(numeric) ? numeric : raw;
    });
    row[header[wordIndex]] = word;
    return row;
  });
  const totalRows = lines.length - 1;
  return { detailed: rows, detailed_total_rows: totalRows, detailed_truncated: totalRows > rows.length };
}

const MAX_INLINE_TEXT = 200_000;
const MAX_DETAILED_ROWS = 5_000;
