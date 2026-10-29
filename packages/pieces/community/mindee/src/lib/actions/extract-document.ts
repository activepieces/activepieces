import { createAction } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeProps } from '../common/props';
import { mindeeSchemas } from '../output-schemas';
import { productActionHelpers } from './product-action-helpers';

export const extractDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'extract_document',
  displayName: 'Extract Document',
  description: 'Extracts structured fields from a document with one of your Mindee extraction models.',
  classification: 'READ',
  audience: 'human',
  aiMetadata: {
    description:
      'Extract structured data (for example invoice totals, receipt line items, ID details) from a document with a Mindee extraction model. Returns the fields defined in the model data schema as name to value pairs. Waits up to 4 minutes; if Mindee is still processing, the step fails with the job ID so you can collect it later with Get Job Status and Get Result. Each run spends Mindee page credits.',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.builderProps('extraction'),
    ...mindeeProps.extractionOptionProps(),
  },
  outputSchema: mindeeSchemas.inferenceSchema('extraction'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithFile({ apiKey: auth.secret_text, product: 'extraction', props: propsValue });
  },
});

export const extractDocumentAiAction = createAction({
  auth: mindeeAuth,
  name: 'extract_document_ai',
  displayName: 'Extract Document (AI)',
  description: 'Extracts structured fields from a document with one of your Mindee extraction models.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Extract structured data (for example invoice totals, receipt line items, ID details) from a document with a Mindee extraction model. Returns the fields defined in the model data schema as name to value pairs. Waits up to 4 minutes; if Mindee is still processing it returns completed=false and a job_id for Get Job Status and Get Result. Each run spends Mindee page credits. Get the model ID from List Models (model_type extraction).',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.aiProps('extraction'),
    ...mindeeProps.extractionOptionProps(),
  },
  outputSchema: mindeeSchemas.inferenceSchema('extraction'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithUrl({ apiKey: auth.secret_text, product: 'extraction', props: propsValue });
  },
});
