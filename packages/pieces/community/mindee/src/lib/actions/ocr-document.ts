import { createAction } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeSchemas } from '../output-schemas';
import { productActionHelpers } from './product-action-helpers';

export const ocrDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'ocr_document',
  displayName: 'Read Document Text (OCR)',
  description: 'Reads all the text in a document with one of your Mindee OCR models.',
  classification: 'READ',
  audience: 'human',
  aiMetadata: {
    description:
      'Read the full text of a document page by page with a Mindee OCR model. Returns the text and per-page content. Waits up to 4 minutes; if Mindee is still processing, the step fails with the job ID so you can collect it later with Get Job Status and Get Result. Each run spends Mindee page credits.',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.builderProps('ocr'),
  },
  outputSchema: mindeeSchemas.inferenceSchema('ocr'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithFile({ apiKey: auth.secret_text, product: 'ocr', props: propsValue });
  },
});

export const ocrDocumentAiAction = createAction({
  auth: mindeeAuth,
  name: 'ocr_document_ai',
  displayName: 'Read Document Text (OCR) (AI)',
  description: 'Reads all the text in a document with one of your Mindee OCR models.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read the full text of a document page by page with a Mindee OCR model. Returns the text and per-page content. Waits up to 4 minutes; if Mindee is still processing it returns completed=false and a job_id for Get Job Status and Get Result. Each run spends Mindee page credits. Get the model ID from List Models (model_type ocr).',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.aiProps('ocr'),
  },
  outputSchema: mindeeSchemas.inferenceSchema('ocr'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithUrl({ apiKey: auth.secret_text, product: 'ocr', props: propsValue });
  },
});
