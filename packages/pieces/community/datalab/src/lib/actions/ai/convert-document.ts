import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../../auth';
import { datalabSource } from '../../common/source';
import { convertOperation } from '../../operations/convert';

export const aiConvertDocumentAction = createAction({
  auth: datalabAuth,
  name: 'ai_convert_document',
  classification: 'READ',
  displayName: 'Convert Document',
  description: 'Converts a document at a public URL into Markdown, HTML or JSON.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Converts a whole document at a public URL (PDF, Word, PowerPoint, spreadsheet, HTML, EPUB or image) into markdown, html, a json block tree or chunks. Pick it to read the full text; use Extract Structured Data to pull named fields, or Segment Document to split a file into parts. Each run spends Datalab credits. If Datalab is still working after 4 minutes it returns completed=false and a request_id; pass that request_id to Get Result with the Convert Document operation.',
    idempotent: true,
  },
  outputSchema: convertOperation.outputSchema,
  props: convertOperation.aiProps(),
  async run({ auth, propsValue, files }) {
    const source = datalabSource.fromAi({ fileUrl: propsValue.file_url, noun: 'document' });
    return convertOperation.run({ apiKey: auth.secret_text, source, values: propsValue, audience: 'ai', files });
  },
});
