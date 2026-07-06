import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf4meAuth } from '../auth';
import { pdf4meCommon } from '../common';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'English' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Portuguese', value: 'Portuguese' },
  { label: 'Dutch', value: 'Dutch' },
  { label: 'Russian', value: 'Russian' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'Arabic', value: 'Arabic' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'Turkish', value: 'Turkish' },
  { label: 'Polish', value: 'Polish' },
  { label: 'Swedish', value: 'Swedish' },
  { label: 'Danish', value: 'Danish' },
  { label: 'Norwegian', value: 'Norwegian' },
  { label: 'Finnish', value: 'Finnish' },
  { label: 'Czech', value: 'Czech' },
];

export const pdfToWordAction = createAction({
  auth: pdf4meAuth,
  name: 'pdf_to_word',
  displayName: 'Convert PDF to Word',
  description: 'Converts a PDF file to an editable Microsoft Word (DOCX) document.',
  audience: 'both',
  aiMetadata: {
    description: 'Converts a PDF into an editable Word (DOCX) document via the PDF4me API, with a quality mode (Draft for one-call processing vs. High per-page processing) and optional OCR for scanned/image-based PDFs. Use when an agent needs the text of a PDF as an editable Word file; the PDF file is required, and setting the correct document language improves OCR accuracy. A pure conversion that is idempotent — the same input and settings always yield the same DOCX with no stored side effect.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      description: 'The PDF file to convert to Word format.',
      required: true,
    }),
    qualityType: Property.StaticDropdown({
      displayName: 'Conversion Quality',
      description:
        'Draft processes the entire file in one API call. High uses per-page processing — best for scanned or image-heavy PDFs.',
      required: false,
      defaultValue: 'Draft',
      options: {
        options: [
          { label: 'Draft (faster, one call per file)', value: 'Draft' },
          { label: 'High (slower, better for scanned PDFs)', value: 'High' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Document Language',
      description: 'Language of the text in the PDF. Used to improve OCR accuracy.',
      required: false,
      defaultValue: 'English',
      options: { options: LANGUAGE_OPTIONS },
    }),
    mergeAllSheets: Property.Checkbox({
      displayName: 'Merge All Sheets',
      description: 'Merge all pages into a single Word document sheet.',
      required: false,
      defaultValue: false,
    }),
    ocrWhenNeeded: Property.Checkbox({
      displayName: 'Enable OCR for Scanned PDFs',
      description: 'Automatically apply OCR when the PDF contains scanned images instead of selectable text.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { file, qualityType, language, mergeAllSheets, ocrWhenNeeded } = context.propsValue;
    const outputName = file.filename.replace(/\.pdf$/i, '');

    const response = await pdf4meCommon.callFileApi({
      apiKey: context.auth.secret_text,
      endpoint: '/api/v2/ConvertPdfToWord',
      body: {
        docContent: file.data.toString('base64'),
        docName: file.filename,
        qualityType: qualityType ?? 'Draft',
        language: language ?? 'English',
        mergeAllSheets: mergeAllSheets ?? false,
        outputFormat: 'docx',
        ocrWhenNeeded: String(ocrWhenNeeded ?? false),
      },
    });

    const fileName = pdf4meCommon.fileNameFromHeaders(
      response.headers,
      `${outputName}.docx`,
    );

    return {
      file_name: fileName,
      file_data_base64: Buffer.from(response.body).toString('base64'),
      success: true,
    };
  },
});
