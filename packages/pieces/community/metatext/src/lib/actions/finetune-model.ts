import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { metatextAuth } from '../auth';
import { metatextApiCall } from '../common';

export const finetuneModel = createAction({
  auth: metatextAuth,
  name: 'finetune_model',
  displayName: 'Fine-tune Model',
  description: 'Initiate a fine-tuning job for your model',
  audience: 'both',
  aiMetadata: { description: 'Start a new Metatext fine-tuning job for a project, training a base model on the project data for a chosen task type (classification, extraction, or generation). Use when you want to kick off model training rather than run inference. Requires the project ID, task type, and base model name; optional hyperparameters tune the run. Not idempotent: each call launches a separate training job.', idempotent: false },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of your project',
      required: true,
    }),
    taskType: Property.StaticDropdown({
      displayName: 'Task Type',
      description: 'The type of task for fine-tuning',
      required: true,
      options: {
        options: [
          { label: 'Classification', value: 'classification' },
          { label: 'Extraction', value: 'extraction' },
          { label: 'Generation', value: 'generation' },
        ],
      },
    }),
    modelBase: Property.ShortText({
      displayName: 'Base Model',
      description: 'The base model to fine-tune (e.g., BERT)',
      required: true,
    }),
    hyperparameters: Property.Object({
      displayName: 'Hyperparameters',
      description: 'Custom hyperparameters for fine-tuning',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { project_id, taskType, modelBase, hyperparameters } = propsValue;

    const body: Record<string, unknown> = {
      taskType,
      modelBase,
    };

    if (hyperparameters && Object.keys(hyperparameters).length > 0) {
      body['hyperparameters'] = hyperparameters;
    }

    const response = await metatextApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/v2/projects/${project_id}/finetune`,
      authType: 'bearer',
      body,
    });

    return response;
  },
});
