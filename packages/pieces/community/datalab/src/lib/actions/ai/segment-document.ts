import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../../auth';
import { datalabSource } from '../../common/source';
import { segmentOperation } from '../../operations/segment';

export const aiSegmentDocumentAction = createAction({
  auth: datalabAuth,
  name: 'ai_segment_document',
  classification: 'READ',
  displayName: 'Segment Document',
  description: 'Splits a document at a public URL into its separate documents or named sections and returns the pages of each part.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Splits the document at a public URL into parts and returns each part\'s name and page numbers (counted from 0). Give sections to find named parts such as Invoice or Contract, or leave sections empty to detect where each separate document starts in a combined file. Use Convert Document for the text and Extract Structured Data for field values. Each call spends Datalab credits and a repeat call is billed again. If Datalab is still working after about 4 minutes it returns completed=false with request_id; then call Get Result with the Segment Document operation and that request_id instead of running this action again.',
    idempotent: true,
  },
  outputSchema: segmentOperation.outputSchema,
  props: segmentOperation.aiProps(),
  async run({ auth, propsValue }) {
    return segmentOperation.run({
      apiKey: auth.secret_text,
      source: datalabSource.fromAi({ fileUrl: propsValue.file_url, noun: 'document' }),
      sections: propsValue.sections,
      instructions: propsValue.instructions,
      detailLevel: propsValue.detail_level,
      mode: propsValue.mode,
      pageRange: propsValue.page_range,
      maxPages: propsValue.max_pages,
      skipCache: propsValue.skip_cache,
      audience: 'ai',
    });
  },
});
