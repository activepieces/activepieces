import { createAction } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeSchemas } from '../output-schemas';
import { productActionHelpers } from './product-action-helpers';

export const splitDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'split_document',
  displayName: 'Split Document',
  description: 'Finds where each document starts and ends in a multi-document file with one of your Mindee split models.',
  classification: 'READ',
  audience: 'human',
  aiMetadata: {
    description:
      'Find the separate documents inside one multi-page file with a Mindee split model. Returns each document type with its 0-based start and end page. Waits up to 4 minutes; if Mindee is still processing, the step fails with the job ID so you can collect it later with Get Job Status and Get Result. Each run spends Mindee page credits.',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.builderProps('split'),
  },
  outputSchema: mindeeSchemas.inferenceSchema('split'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithFile({ apiKey: auth.secret_text, product: 'split', props: propsValue });
  },
});

export const splitDocumentAiAction = createAction({
  auth: mindeeAuth,
  name: 'split_document_ai',
  displayName: 'Split Document (AI)',
  description: 'Finds where each document starts and ends in a multi-document file with one of your Mindee split models.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Find the separate documents inside one multi-page file with a Mindee split model. Returns each document type with its 0-based start and end page. Waits up to 4 minutes; if Mindee is still processing it returns completed=false and a job_id for Get Job Status and Get Result. Each run spends Mindee page credits. Get the model ID from List Models (model_type split).',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.aiProps('split'),
  },
  outputSchema: mindeeSchemas.inferenceSchema('split'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithUrl({ apiKey: auth.secret_text, product: 'split', props: propsValue });
  },
});
