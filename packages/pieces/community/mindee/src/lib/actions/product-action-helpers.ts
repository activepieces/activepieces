import { Property } from '@activepieces/pieces-framework';
import { mindeeFiles } from '../common/file';
import { InferenceOptions, mindeeInference, MindeeProduct } from '../common/inference';
import { mindeeProps } from '../common/props';

function builderProps(product: MindeeProduct) {
  return {
    model_id: mindeeProps.modelDropdown({ product }),
    file: Property.File({
      displayName: 'File',
      description: 'The document to process (PDF, JPEG, PNG, WEBP, TIFF or HEIC).',
      required: true,
    }),
    alias: mindeeProps.aliasProp(),
  };
}

function aiProps(product: MindeeProduct) {
  return {
    model_id: Property.ShortText({
      displayName: 'Model ID',
      description: `UUID of a Mindee ${mindeeProps.PRODUCT_LABELS[product]} model, from List Models.`,
      required: true,
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'Public https:// URL of the document. Mindee downloads it directly.',
      required: true,
    }),
    alias: mindeeProps.aliasProp(),
  };
}

async function runWithFile({ apiKey, product, props }: { apiKey: string; product: MindeeProduct; props: Record<string, unknown> }) {
  const output = await mindeeInference.runInference({
    apiKey,
    product,
    modelId: typeof props['model_id'] === 'string' ? props['model_id'] : undefined,
    source: { type: 'upload', upload: mindeeFiles.readFileProp({ value: props['file'], label: 'File' }) },
    options: readOptions(props),
  });
  if (!output.completed) {
    throw new Error(output.message ?? `Mindee is still processing job ${output.job_id}. Use Get Job Status, then Get Result, to collect it later.`);
  }
  return output;
}

function runWithUrl({ apiKey, product, props }: { apiKey: string; product: MindeeProduct; props: Record<string, unknown> }) {
  return mindeeInference.runInference({
    apiKey,
    product,
    modelId: typeof props['model_id'] === 'string' ? props['model_id'] : undefined,
    source: { type: 'url', url: typeof props['file_url'] === 'string' ? props['file_url'] : undefined },
    options: readOptions(props),
  });
}

function readOptions(props: Record<string, unknown>): InferenceOptions {
  return {
    alias: typeof props['alias'] === 'string' ? props['alias'] : undefined,
    rag: props['rag'] === true,
    rawText: props['raw_text'] === true,
    confidence: props['confidence'] === true,
    textContext: typeof props['text_context'] === 'string' ? props['text_context'] : undefined,
  };
}

export const productActionHelpers = { builderProps, aiProps, runWithFile, runWithUrl };
