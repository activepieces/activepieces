import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { datalabSource } from '../common/source';
import { segmentOperation } from '../operations/segment';

export const segmentDocumentAction = createAction({
  auth: datalabAuth,
  name: 'segment_document',
  classification: 'READ',
  displayName: 'Segment Document',
  description: 'Splits a combined file into its separate documents, or finds named sections, and returns the pages of each part.',
  audience: 'human',
  aiMetadata: {
    description:
      'Splits a document into its parts with Datalab and returns the name and page numbers (counted from 0) of each part: either the separate documents detected in a combined file, or the named sections you list. Pick it to find where parts start and end; use Convert Document for the text and Extract Structured Data for field values. Each run spends Datalab credits and a repeat run is billed again; the step waits up to 4 minutes, then fails with the request ID, and Get Result collects that request without running the action again.',
    idempotent: true,
  },
  outputSchema: segmentOperation.outputSchema,
  props: segmentOperation.humanProps(),
  async run({ auth, propsValue }) {
    return segmentOperation.run({
      apiKey: auth.secret_text,
      source: datalabSource.fromHuman({ source: propsValue.source, input: propsValue.document, noun: 'document' }),
      method: propsValue.split_method,
      sections: propsValue.sections,
      instructions: propsValue.instructions,
      detailLevel: propsValue.detail_level,
      mode: propsValue.mode,
      pageRange: propsValue.page_range,
      maxPages: propsValue.max_pages,
      skipCache: propsValue.skip_cache,
      audience: 'human',
    });
  },
});
