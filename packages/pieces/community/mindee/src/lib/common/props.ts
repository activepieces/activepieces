import { Property } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeApi } from './api';
import { MindeeProduct } from './inference';

function modelDropdown({ product, displayName, description }: { product: MindeeProduct; displayName?: string; description?: string }) {
  return Property.Dropdown({
    auth: mindeeAuth,
    displayName: displayName ?? 'Model',
    description: description ?? `Your Mindee ${PRODUCT_LABELS[product]} model. Models are created at app.mindee.com.`,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Mindee account first.' };
      }
      try {
        const models = await mindeeApi.listAllModels({ apiKey: auth.secret_text, modelType: product });
        if (models.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: `No ${PRODUCT_LABELS[product]} models found. Create one at app.mindee.com first.`,
          };
        }
        return {
          disabled: false,
          options: models.flatMap((model) => (model.id === null ? [] : [{ label: model.name ?? model.id, value: model.id }])),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: error instanceof Error ? error.message.slice(0, 200) : 'Could not load models from Mindee.',
        };
      }
    },
  });
}

function aliasProp() {
  return Property.ShortText({
    displayName: 'Alias',
    description: 'Optional tag of your own (for example an internal document ID). Mindee returns it with the job and result.',
    required: false,
  });
}

function extractionOptionProps() {
  return {
    rag: Property.Checkbox({
      displayName: 'Use RAG',
      description: 'Use the RAG documents uploaded for this model to improve accuracy.',
      required: false,
      defaultValue: false,
    }),
    raw_text: Property.Checkbox({
      displayName: 'Include Raw Text',
      description: 'Also return the full text of the document.',
      required: false,
      defaultValue: false,
    }),
    confidence: Property.Checkbox({
      displayName: 'Include Confidence',
      description: 'Return a confidence level (Certain, High or Medium) for each top-level field.',
      required: false,
      defaultValue: false,
    }),
    text_context: Property.LongText({
      displayName: 'Text Context',
      description: 'Optional hint for the model for this document, for example "This is a grocery receipt."',
      required: false,
    }),
  };
}

function productProp() {
  return Property.StaticDropdown<MindeeProduct, true>({
    displayName: 'Product',
    description: 'The Mindee product that ran the inference.',
    required: true,
    defaultValue: 'extraction',
    options: {
      disabled: false,
      options: PRODUCT_OPTIONS,
    },
  });
}

const PRODUCT_LABELS: Record<MindeeProduct, string> = {
  extraction: 'Extraction',
  classification: 'Classification',
  crop: 'Crop',
  ocr: 'OCR',
  split: 'Split',
};

const PRODUCT_OPTIONS: { label: string; value: MindeeProduct }[] = [
  { label: 'Extraction', value: 'extraction' },
  { label: 'Classification', value: 'classification' },
  { label: 'Crop', value: 'crop' },
  { label: 'OCR', value: 'ocr' },
  { label: 'Split', value: 'split' },
];

export const mindeeProps = { modelDropdown, aliasProp, extractionOptionProps, productProp, PRODUCT_LABELS, PRODUCT_OPTIONS };
