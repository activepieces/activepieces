import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const ocrPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'ocr_pdf',
  displayName: 'OCR PDF',
  description:
    'Run OCR on a PDF to make scanned documents searchable. Supports 100+ languages.',
  audience: 'both',
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

    const languages =
      Array.isArray(ocr_languages) && ocr_languages.length > 0
        ? ocr_languages.map((lang) => String(lang)).filter((l) => l.length > 0)
        : ['eng'];

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      files: context.files,
      tool: 'pdfocr',
      uploads: [fileToUploadInput(file)],
      options: { ocr_languages: languages },
      output_filename,
      packaged_filename,
    });
  },
});
