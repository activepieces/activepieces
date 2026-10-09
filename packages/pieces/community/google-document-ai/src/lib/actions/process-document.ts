import { createAction, Property } from '@activepieces/pieces-framework';

import { googleDocumentAiAuth } from '../auth';
import { GoogleDocumentAiApi, processorResourceName } from '../common/client';
import type { ProcessRequest } from '../common/client';
import { DEFAULT_FIELD_MASK, effectiveFieldMask, MIME_BY_EXTENSION, mimeTypeFor, parsePageSelection, summarizeDocument } from '../common/document';
import { processorProp } from '../common/props';
import { resolveAuth } from '../common/token';
import { processDocumentOutputSchema } from '../output-schemas';

const sourceOptions: { label: string; value: 'file' | 'gcs' }[] = [
  { label: 'File (upload or a file from a previous step)', value: 'file' },
  { label: 'Cloud Storage URI (gs://bucket/object)', value: 'gcs' },
];

export const processDocument = createAction({
  name: 'processDocument',
  classification: 'READ',
  displayName: 'Process Document',
  description: 'Run a document through a Document AI processor and get its text, entities, form fields and tables',
  audience: 'both',
  aiMetadata: {
    description:
      'Extract text, entities, form fields and tables from one document (a flow file or a gs:// Cloud Storage URI) with a Google Document AI processor of the connected project. Use for OCR, form parsing or invoice/ID extraction; online processing takes up to 15 pages (30 in imageless mode), so pick pages or use Custom API Call batchProcess for longer files. Stores nothing, but each call is billed per page; safe to retry.',
    idempotent: true,
  },
  outputSchema: processDocumentOutputSchema,
  auth: googleDocumentAiAuth,
  props: {
    processor: processorProp,
    processorVersion: Property.ShortText({
      displayName: 'Processor Version',
      description: 'Optional: a specific version id (e.g. `pretrained-ocr-v2.0-2023-06-02`) or its full resource name. Empty uses the processor\'s default version.',
      required: false,
    }),
    source: Property.StaticDropdown<'file' | 'gcs', true>({
      displayName: 'Document Source',
      required: true,
      defaultValue: 'file',
      options: { disabled: false, options: sourceOptions },
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The document to process (PDF, GIF, TIFF, JPEG, PNG, BMP, WEBP; Layout Parser also takes DOCX, PPTX, XLSX, HTML). Online processing accepts up to 15 pages, 30 with Imageless Mode.',
      required: false,
    }),
    gcsUri: Property.ShortText({
      displayName: 'Cloud Storage URI',
      description: '`gs://bucket/path/file.pdf`. The Document AI service agent of your project needs read access to the bucket.',
      required: false,
    }),
    mimeType: Property.ShortText({
      displayName: 'MIME Type',
      description: `Optional: inferred from the file name / URI extension. One of ${[...new Set(Object.values(MIME_BY_EXTENSION))].join(', ')}.`,
      required: false,
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Optional: only process these pages, 1-based, e.g. `1,3-5`. Useful to stay under the online page limit.',
      required: false,
    }),
    imagelessMode: Property.Checkbox({
      displayName: 'Imageless Mode',
      description: 'Do not return page images in the document (smaller output) and raise the online limit from 15 to 30 pages.',
      required: false,
      defaultValue: true,
    }),
    includeFullDocument: Property.Checkbox({
      displayName: 'Include Full Document',
      description: 'Also return the raw Document AI `document` (layout, blocks, paragraphs, tokens…). Can be several MB.',
      required: false,
      defaultValue: false,
    }),
    fieldMask: Property.ShortText({
      displayName: 'Field Mask (Advanced)',
      description: `Comma-separated top-level \`document\` / \`pages\` fields to request. Default without full document: \`${DEFAULT_FIELD_MASK}\`. \`text\` is added automatically when a requested field needs it (entities, form fields, tables, layout), and \`pages.pageNumber\` when a page-level field is requested so results keep their page numbers. Ignored when "Include Full Document" is on.`,
      required: false,
    }),
  },
  async run(context) {
    const { processor, processorVersion, source, file, gcsUri, mimeType, pages, imagelessMode, includeFullDocument, fieldMask } = context.propsValue;
    const auth = await resolveAuth(context.auth);
    const name = processorResourceName({ auth, processor, version: processorVersion ?? undefined });

    const request: ProcessRequest = {};
    if (source === 'gcs') {
      const uri = String(gcsUri ?? '').trim();
      if (!uri.startsWith('gs://')) {
        throw new Error('Cloud Storage URI must look like gs://bucket/path/file.pdf.');
      }
      request.gcsDocument = { gcsUri: uri, mimeType: mimeTypeFor({ explicit: mimeType ?? undefined, names: [uri] }) };
    } else {
      if (!file) {
        throw new Error('Pick a file to process (or switch Document Source to Cloud Storage URI).');
      }
      request.rawDocument = {
        content: file.base64,
        mimeType: mimeTypeFor({ explicit: mimeType ?? undefined, names: [file.filename, file.extension ? `x.${file.extension}` : undefined] }),
        ...(file.filename ? { displayName: file.filename } : {}),
      };
    }

    const selectedPages = parsePageSelection(pages ?? undefined);
    if (selectedPages) request.processOptions = { individualPageSelector: { pages: selectedPages } };
    if (imagelessMode !== false) request.imagelessMode = true;
    if (!includeFullDocument) request.fieldMask = effectiveFieldMask({ fieldMask: fieldMask ?? undefined });

    const response = await GoogleDocumentAiApi.process({ auth, processorName: name, request });
    if (response.document?.error?.message) {
      throw new Error(`Document AI could not process the document: ${response.document.error.message}`);
    }
    return {
      processor: name,
      ...summarizeDocument({ document: response.document, includeFull: Boolean(includeFullDocument), selectedPages }),
      ...(response.humanReviewStatus ? { humanReviewStatus: response.humanReviewStatus } : {}),
    };
  },
});
