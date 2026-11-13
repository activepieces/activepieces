import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iloveSchemas } from '../common/schemas';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const ocrPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'ocr_pdf',
  classification: 'READ',
  displayName: 'OCR PDF',
  description:
    'Run OCR on a PDF to make scanned documents searchable. Supports 100+ languages.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Add a searchable, selectable text layer to a scanned or image-only PDF via OCR, defaulting to English when no language is given (accepts one or more ISO 639-2 codes such as eng, fra, deu, chi_sim). Use this before extracting or searching text in scanned documents. Each run produces a new output file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    ocr_languages: Property.Array({
      displayName: 'OCR Languages',
      description:
        'ISO 639-2 language codes (e.g. eng, fra, deu, spa, ita, por, rus, chi_sim, jpn, ara). Defaults to English.',
      required: false,
      properties: {},
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, ocr_languages, output_filename, packaged_filename } =
      context.propsValue;

    const given = Array.isArray(ocr_languages)
      ? ocr_languages.map((lang) => languageOf(lang)).filter((l) => l.length > 0)
      : [];
    const invalid = given.filter((lang) => !/^[a-z]{3}(_[a-z]+)?$/.test(lang));
    if (invalid.length > 0) {
      throw new Error(`OCR languages must be ISO 639-2 codes like "eng" or "chi_sim". Invalid: ${invalid.join(', ')}`);
    }
    const languages = given.length > 0 ? given : ['eng'];

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'pdfocr',
      uploads: [fileToUploadInput({ file: file })],
      options: { ocr_languages: languages },
      output_filename,
      packaged_filename,
    });
  },
});

function languageOf(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length > 0 && entries.every(([key, item]) => /^\d+$/.test(key) && typeof item === 'string')) {
      return entries
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, item]) => item)
        .join('')
        .trim();
    }
    const first = Object.values(value).find((item) => typeof item === 'string');
    return typeof first === 'string' ? first.trim() : '';
  }
  return String(value ?? '').trim();
}
