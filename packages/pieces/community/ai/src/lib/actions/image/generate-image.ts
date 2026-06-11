import {
  AiContext,
  ApFile,
  createAction,
  DynamicPropsValue,
  InputPropertyMap,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import mime from 'mime-types';
import { isNil, getEffectiveProviderAndModel, ExecuteAiImage, ExecuteAiMode } from '@activepieces/shared';
import { AIProviderName } from '@activepieces/shared';
import { aiProps } from '../../common/props';

export const generateImageAction = createAction({
  name: 'generateImage',
  displayName: 'Generate Image',
  description: 'Create unique, high-quality images from simple text descriptions using AI.',
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
        const rawProvider = propsValue['provider'] as unknown as string;
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
                    : modelId === 'gpt-image-1'
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
                    : modelId === 'gpt-image-1'
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

          if (modelId === 'gpt-image-1') {
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
    const provider = context.propsValue.provider as AIProviderName;
    const modelId = context.propsValue.model;
    const prompt = context.propsValue.prompt;
    const advancedOptions = context.propsValue.advancedOptions;

    const inputImages = collectInputImages({
      inputImages: context.propsValue.inputImages,
      advancedOptions,
    });
    const hasInputImages = inputImages.length > 0;

    const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider, model: modelId });
    const resolvedProvider = (effectiveProvider ?? provider) as AIProviderName;

    const image = await withImageInputErrorContext({ modelId, hasInputImages }, async () => {
      // Google / OpenRouter / Activepieces / Cloudflare-gateway models emit images over the TEXT
      // API (responseModalities); the rest use the dedicated image API. Both run on the worker.
      if (TEXT_API_IMAGE_PROVIDERS.has(resolvedProvider)) {
        return generateViaTextApi({ ai: context.ai, provider, modelId, prompt, inputImages });
      }
      const sanitizedAdvancedOptions = stripLegacyImageField(advancedOptions);
      const response = await context.ai.execute({
        mode: ExecuteAiMode.IMAGE,
        provider,
        model: modelId,
        prompt,
        ...(hasInputImages ? { inputImages: inputImages.map((file) => file.base64) } : {}),
        providerOptions: {
          [resolvedProvider]: { ...sanitizedAdvancedOptions },
        },
        actionName: 'generateImage',
      });
      return firstImageOrThrow(response.images);
    });

    return context.files.write({
      data: Buffer.from(image.base64, 'base64'),
      fileName: 'image.png',
    });
  },
});

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

const generateViaTextApi = async ({
  ai,
  provider,
  modelId,
  prompt,
  inputImages,
}: {
  ai: AiContext;
  provider: AIProviderName;
  modelId: string;
  prompt: string;
  inputImages: ApFile[];
}): Promise<ExecuteAiImage> => {
  const imageParts = inputImages.map((file) => {
    const detected = file.extension ? mime.lookup(file.extension) : false;
    const fileType =
      detected && ALLOWED_IMAGE_MIME_TYPES.has(detected)
        ? detected
        : 'image/jpeg';

    return {
      type: 'image',
      image: `data:${fileType};base64,${file.base64}`,
    };
  });

  const response = await ai.execute({
    mode: ExecuteAiMode.TEXT,
    provider,
    model: modelId,
    providerOptions: {
      google: { responseModalities: ['TEXT', 'IMAGE'] },
      openrouter: { modalities: ['image', 'text'] },
    },
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }, ...imageParts],
      },
    ],
    actionName: 'generateImage',
  });

  return firstImageOrThrow(response.images);
};

const withImageInputErrorContext = async <T>(
  { modelId, hasInputImages }: { modelId: string; hasInputImages: boolean },
  run: () => Promise<T>,
): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (!hasInputImages) {
      throw error;
    }
    const original = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Image generation failed for model "${modelId}". ` +
      `This model may not support input images. Try a model that supports image editing — ` +
      `for example gpt-image-1, dall-e-2, or a Gemini Nano Banana model — or remove the input images. ` +
      `Original error: ${original}`,
    );
  }
};

const firstImageOrThrow = (images: ExecuteAiImage[] | undefined): ExecuteAiImage => {
  const image = images?.[0];
  if (isNil(image)) {
    throw new Error('No image generated');
  }
  return image;
};

const stripLegacyImageField = (
  advancedOptions: DynamicPropsValue | undefined,
): DynamicPropsValue | undefined => {
  if (isNil(advancedOptions)) {
    return advancedOptions;
  }
  const { image: _legacy, ...rest } = advancedOptions as Record<string, unknown>;
  return rest as DynamicPropsValue;
};

const ALLOWED_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

const TEXT_API_IMAGE_PROVIDERS: ReadonlySet<AIProviderName> = new Set([
  AIProviderName.GOOGLE,
  AIProviderName.ACTIVEPIECES,
  AIProviderName.OPENROUTER,
  AIProviderName.CLOUDFLARE_GATEWAY,
]);
