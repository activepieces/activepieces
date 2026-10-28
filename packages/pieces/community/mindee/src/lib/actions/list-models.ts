import { createAction, Property } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeApi } from '../common/api';
import { mindeeInputs } from '../common/inputs';
import { MindeeProduct } from '../common/inference';
import { mindeeProps } from '../common/props';
import { mindeeSchemas } from '../output-schemas';

export const listModelsAction = createAction({
  auth: mindeeAuth,
  name: 'list_models',
  displayName: 'List Models',
  description: 'Lists the models in your Mindee organization.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List the Mindee models available to this API key, optionally filtered by name or model_type (extraction, classification, crop, ocr, split). Use it to find the model_id the run actions need. Read-only, free, safe to retry.',
    idempotent: true,
  },
  props: {
    model_type: Property.StaticDropdown<MindeeProduct, false>({
      displayName: 'Model Type',
      required: false,
      options: { disabled: false, options: mindeeProps.PRODUCT_OPTIONS },
    }),
    name: Property.ShortText({ displayName: 'Name Contains', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false, defaultValue: 1 }),
    per_page: Property.Number({ displayName: 'Per Page', description: 'Between 1 and 100.', required: false, defaultValue: 50 }),
  },
  outputSchema: mindeeSchemas.models,
  async run({ auth, propsValue }) {
    return mindeeApi.listModels({
      apiKey: auth.secret_text,
      name: propsValue.name,
      modelType: propsValue.model_type,
      page: mindeeInputs.positiveInt({ value: propsValue.page, fallback: 1, max: 10_000 }),
      perPage: mindeeInputs.positiveInt({ value: propsValue.per_page, fallback: 50, max: 100 }),
    });
  },
});

