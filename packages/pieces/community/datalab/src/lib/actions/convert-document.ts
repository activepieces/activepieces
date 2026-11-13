import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { datalabSource } from '../common/source';
import { convertOperation } from '../operations/convert';

export const convertDocumentAction = createAction({
  auth: datalabAuth,
  name: 'convert_document',
  classification: 'READ',
  displayName: 'Convert Document',
  description: 'Converts a PDF, Word file, slide deck, spreadsheet or image into Markdown, HTML or JSON.',
  audience: 'human',
  aiMetadata: {
    description:
      'Converts a whole document (PDF, Word, PowerPoint, spreadsheet, HTML, EPUB or image) into Markdown, HTML, a JSON block tree or chunks. Pick it to read or pass on the full text; use Extract Structured Data to pull named fields, or Segment Document to split a file into parts. Each run spends Datalab credits. It waits up to 4 minutes, then fails with the request ID so Get Result can collect the result later.',
    idempotent: true,
  },
  outputSchema: convertOperation.outputSchema,
  props: convertOperation.humanProps(),
  async run({ auth, propsValue, files }) {
    const source = datalabSource.fromHuman({ source: propsValue.source, file: propsValue.file, fileUrl: propsValue.file_url, noun: 'document' });
    return convertOperation.run({ apiKey: auth.secret_text, source, values: propsValue, audience: 'human', files });
  },
});
