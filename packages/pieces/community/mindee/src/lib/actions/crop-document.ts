import { createAction } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeSchemas } from '../output-schemas';
import { productActionHelpers } from './product-action-helpers';

export const cropDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'crop_document',
  displayName: 'Crop Document',
  description: 'Finds each separate object (for example several receipts on one scan) with one of your Mindee crop models.',
  classification: 'READ',
  audience: 'human',
  aiMetadata: {
    description:
      'Detect the separate objects in one image or page (for example several receipts or cards scanned together) with a Mindee crop model. Returns each object type, page and polygon. Waits up to 4 minutes; if Mindee is still processing, the step fails with the job ID so you can collect it later with Get Job Status and Get Result. Each run spends Mindee page credits.',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.builderProps('crop'),
  },
  outputSchema: mindeeSchemas.inferenceSchema('crop'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithFile({ apiKey: auth.secret_text, product: 'crop', props: propsValue });
  },
});

export const cropDocumentAiAction = createAction({
  auth: mindeeAuth,
  name: 'crop_document_ai',
  displayName: 'Crop Document (AI)',
  description: 'Finds each separate object (for example several receipts on one scan) with one of your Mindee crop models.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Detect the separate objects in one image or page (for example several receipts or cards scanned together) with a Mindee crop model. Returns each object type, page and polygon. Waits up to 4 minutes; if Mindee is still processing it returns completed=false and a job_id for Get Job Status and Get Result. Each run spends Mindee page credits. Get the model ID from List Models (model_type crop).',
    idempotent: true,
  },
  props: {
    ...productActionHelpers.aiProps('crop'),
  },
  outputSchema: mindeeSchemas.inferenceSchema('crop'),
  async run({ auth, propsValue }) {
    return productActionHelpers.runWithUrl({ apiKey: auth.secret_text, product: 'crop', props: propsValue });
  },
});
