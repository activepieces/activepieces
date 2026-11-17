import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../../auth';
import { extractOperation } from '../../operations/extract';

export const aiExtractStructuredDataAction = createAction({
  auth: datalabAuth,
  name: 'ai_extract_structured_data',
  classification: 'READ',
  displayName: 'Extract Structured Data',
  description: 'Pulls fields described by a JSON Schema out of a document at a public link, with citations showing where each value was found.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Extracts named fields from a document at a public URL into JSON that follows the JSON Schema you give, plus citations and per-field checks keyed by field path. Pick it for specific values such as an invoice number, totals or line items; use Convert Document to get the whole text. Each run spends Datalab credits; if Datalab is still working after about 4 minutes it returns completed=false and a request_id to pass to Get Result instead of running again.',
    idempotent: true,
  },
  outputSchema: extractOperation.outputSchema,
  props: extractOperation.aiProps(),
  async run({ auth, propsValue }) {
    return extractOperation.run({ apiKey: auth.secret_text, audience: 'ai', input: extractOperation.readAi(propsValue) });
  },
});
