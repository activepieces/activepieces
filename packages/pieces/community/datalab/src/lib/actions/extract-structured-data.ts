import { createAction } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { extractOperation } from '../operations/extract';

export const extractStructuredDataAction = createAction({
  auth: datalabAuth,
  name: 'extract_structured_data',
  classification: 'READ',
  displayName: 'Extract Structured Data',
  description: 'Pulls the fields you list, such as an invoice number or total, out of a document.',
  audience: 'human',
  aiMetadata: {
    description:
      'Extracts named fields from a document (an uploaded file or a public link) into JSON that follows a field list or JSON Schema, with citations and per-field checks. Pick it for specific values such as an invoice number or line items; use Convert Document to get the whole text as Markdown, HTML or JSON. Each run spends Datalab credits; it waits up to 4 minutes, then fails with a request ID that Get Result can collect.',
    idempotent: true,
  },
  outputSchema: extractOperation.outputSchema,
  props: extractOperation.humanProps(),
  async run({ auth, propsValue }) {
    return extractOperation.run({ apiKey: auth.secret_text, audience: 'human', input: extractOperation.readHuman(propsValue) });
  },
});
