import {
  AIProviderName,
  ApFile,
  createAction,
  DynamicPropsValue,
  getEffectiveProviderAndModel,
  InputPropertyMap,
  isNil,
  PieceAuth,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import mime from 'mime-types';
import { runOnWorker, uploadAiFiles } from '../../common/ai-step';
import { aiProps, aiProviderSelection } from '../../common/props';

export const generateImageAction = createAction({
  audience: 'both',
  name: 'generateImage',
  classification: 'READ',
  displayName: 'Generate Image',
  description: 'Create unique, high-quality images from simple text descriptions using AI.',
  aiMetadata: { description: 'Generates an image from a text prompt with an image-capable model and writes it out as a flow file; when Input Images are attached and the model supports editing, it edits, varies, or merges those images instead of generating from scratch. Pick it for any image creation or edit step; use askAi or run_agent when you need text output. Requires a prompt plus an image-capable provider/model, and input images fail on a model that cannot accept them; not idempotent, as each call generates and stores a new image file.', idempotent: false },
  props: {
    provider: aiProps({ modelType: 'image' }).provider,
    model: aiProps({ modelType: 'image' }).model,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    inputImages: Property.Array({
      displayName: 'Input Images',
      description:
        'Provide images for editing, variation, or merging. Support depends on the selected model.',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'Image File',
          required: true,
        }),
      },
    }),
    advancedOptions: Property.DynamicProperties({
      displayName: 'Advanced Options',
      required: false,
      auth: PieceAuth.None(),
      refreshers: ['provider', 'model'],
      props: async (propsValue): Promise<InputPropertyMap> => {
        const rawProvider = aiProviderSelection.resolve(propsValue['provider'])?.provider;
        const rawModel = propsValue['model'] as unknown as string;
        const { provider: effectiveProvider, model: effectiveModel } = getEffectiveProviderAndModel({
          provider: rawProvider,
          model: rawModel,
        });
        const providerId = effectiveProvider ?? rawProvider;
        const modelId = effectiveModel ?? rawModel;

        let options: InputPropertyMap = {};

        if (providerId === AIProviderName.OPENAI) {
          options = {
            quality: Property.StaticDropdown({
              options: {
                options:
                  modelId === 'dall-e-3'
                    ? [
                      { label: 'Standard', value: 'standard' },
                      { label: 'HD', value: 'hd' },
                    ]
                    : isGptImageModel({ modelId })
                      ? [
                        { label: 'High', value: 'high' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Low', value: 'low' },
                      ]
                      : [],
                disabled: modelId === 'dall-e-2',
              },
              defaultValue: modelId === 'dall-e-3' ? 'standard' : 'high',
              displayName: 'Image Quality',
              required: false,
            }),
            size: Property.StaticDropdown({
              options: {
                options:
                  modelId === 'dall-e-3'
                    ? [
                      { label: '1024x1024', value: '1024x1024' },
                      { label: '1792x1024', value: '1792x1024' },
                      { label: '1024x1792', value: '1024x1792' },
                    ]
                    : isGptImageModel({ modelId })
                      ? [
                        { label: '1024x1024', value: '1024x1024' },
                        { label: '1536x1024', value: '1536x1024' },
                        { label: '1024x1536', value: '1024x1536' },
                      ]
                      : [
                        { label: '256x256', value: '256x256' },
                        { label: '512x512', value: '512x512' },
                        { label: '1024x1024', value: '1024x1024' },
                      ],
              },
              displayName: 'Image Size',
              required: false,
            }),
          };

          if (isGptImageModel({ modelId })) {
            options = {
              ...options,
              background: Property.StaticDropdown({
                options: {
                  options: [
                    { label: 'Auto', value: 'auto' },
                    { label: 'Transparent', value: 'transparent' },
                    { label: 'Opaque', value: 'opaque' },
                  ],
                },
                defaultValue: 'auto',
                description: 'The background of the image.',
                displayName: 'Background',
                required: true,
              }),
            };
          }

          return options;
        }

        return options;
      },
    }),
  },
  async run(context) {
    const { provider, configId } = aiProviderSelection.resolveOrThrow(context.propsValue.provider);

    const inputImages = collectInputImages({
      inputImages: context.propsValue.inputImages,
      advancedOptions: context.propsValue.advancedOptions,
    });

    const result = await runOnWorker({
      context,
      request: {
        action: 'GENERATE_IMAGE',
        provider,
        ...spreadIfDefined('providerConfigId', configId),
        modelId: context.propsValue.model,
        prompt: context.propsValue.prompt,
        files: await uploadAiFiles({ context, files: inputImages, mimeTypeOf: inputImageMimeType }),
        ...spreadIfDefined('advancedOptions', withoutInputImages(context.propsValue.advancedOptions)),
      },
    });

    if (result.status === 'paused') {
      return {};
    }

    return result.output.answer;
  },
});

const withoutInputImages = (advancedOptions: DynamicPropsValue | undefined): Record<string, unknown> | undefined => {
  if (isNil(advancedOptions)) {
    return undefined;
  }
  const { image: _inputImages, ...rest } = advancedOptions as Record<string, unknown>;
  return rest;
};

const inputImageMimeType = (file: ApFile): string => {
  const detected = file.extension ? mime.lookup(file.extension) : false;
  return detected && ALLOWED_IMAGE_MIME_TYPES.has(detected) ? detected : 'image/jpeg';
};

const collectInputImages = ({
  inputImages,
  advancedOptions,
}: {
  inputImages?: unknown;
  advancedOptions?: DynamicPropsValue;
}): ApFile[] => {
  const fromTopLevel = extractImageFiles(inputImages);
  if (fromTopLevel.length > 0) {
    return fromTopLevel;
  }
  return extractImageFiles(advancedOptions?.['image']);
};

const extractImageFiles = (value: unknown): ApFile[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (
      entry &&
      typeof entry === 'object' &&
      'file' in entry &&
      entry.file
    ) {
      return [entry.file as ApFile];
    }
    return [];
  });
};

const ALLOWED_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

function isGptImageModel({ modelId }: { modelId: string }): boolean {
  return modelId.startsWith('gpt-image');
}
