import { createAction } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeSchemas } from '../output-schemas';
import { productActionHelpers } from './product-action-helpers';

export const classifyDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'classify_document',
  displayName: 'Classify Document',
  description: 'Detects the type of a document with one of your Mindee classification models.',
  classification: 'READ',
  audience: 'human',
  aiMetadata: {
    description:
      'Identify which document type (from the classes configured in a Mindee classification model) a file is. Returns document_type. Waits up to 4 minutes; if Mindee is still processing, the step fails with the job ID so you can collect it later with Get Job Status and Get Result. Each run spends Mindee page credits.',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.builderProps('classification'),
  },
  outputSchema: mindeeSchemas.inferenceSchema('classification'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithFile({ apiKey: auth.secret_text, product: 'classification', props: propsValue });
  },
});

export const classifyDocumentAiAction = createAction({
  auth: mindeeAuth,
  name: 'classify_document_ai',
  displayName: 'Classify Document (AI)',
  description: 'Detects the type of a document with one of your Mindee classification models.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Identify which document type (from the classes configured in a Mindee classification model) a file is. Returns document_type. Waits up to 4 minutes; if Mindee is still processing it returns completed=false and a job_id for Get Job Status and Get Result. Each run spends Mindee page credits. Get the model ID from List Models (model_type classification).',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.aiProps('classification'),
  },
  outputSchema: mindeeSchemas.inferenceSchema('classification'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithUrl({ apiKey: auth.secret_text, product: 'classification', props: propsValue });
  },
});
