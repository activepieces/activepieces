import {
  ApFile,
  createAction,
  DynamicPropsValue,
  InputPropertyMap,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {
  GeneratedFile,
  generateText,
  GenerateTextResult,
  ImagePart,
  LanguageModel,
  ToolSet,
} from 'ai';
import { generateImage } from 'ai';
import mime from 'mime-types';
import { isNil, getEffectiveProviderAndModel } from '@activepieces/shared';
import { createAIModel } from '../../common/ai-sdk';
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
    const provider = context.propsValue.provider;
    const modelId = context.propsValue.model;

    const inputImages = collectInputImages({
      inputImages: context.propsValue.inputImages,
      advancedOptions: context.propsValue.advancedOptions,
    });

    const image = await getGeneratedImage({
      provider: provider as AIProviderName,
      modelId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      prompt: context.propsValue.prompt,
      inputImages,
      projectId: context.project.id,
      flowId: context.flows.current.id,
      runId: context.run.id,
      advancedOptions: context.propsValue.advancedOptions,
    });

    const imageData =
      image.base64 && image.base64.length > 0
        ? Buffer.from(image.base64, 'base64')
        : Buffer.from(image.uint8Array);

    return context.files.write({
      data: imageData,
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

const getGeneratedImage = async ({
  provider,
  modelId,
  engineToken,
  apiUrl,
  prompt,
  inputImages,
  projectId,
  flowId,
  runId,
  advancedOptions,
}: {
  provider: AIProviderName;
  modelId: string;
  engineToken: string;
  apiUrl: string;
  prompt: string;
  inputImages: ApFile[];
  projectId: string;
  flowId: string;
  runId: string;
  advancedOptions?: DynamicPropsValue;
}): Promise<GeneratedFile> => {
  const model = await createAIModel({
    provider,
    modelId,
    engineToken,
    apiUrl,
    projectId,
    flowId,
    runId,
    isImage: true,
  });

  const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider, model: modelId });
  const resolvedProvider = (effectiveProvider ?? provider) as AIProviderName;

  const hasInputImages = inputImages.length > 0;

  return withImageInputErrorContext({ modelId, hasInputImages }, async () => {
    switch (resolvedProvider) {
      case AIProviderName.GOOGLE:
      case AIProviderName.ACTIVEPIECES:
      case AIProviderName.OPENROUTER:
      case AIProviderName.CLOUDFLARE_GATEWAY:
        return generateImageUsingGenerateText({
          model: model as unknown as LanguageModel,
          prompt,
          inputImages,
        });
      default: {
        const sanitizedAdvancedOptions = stripLegacyImageField(advancedOptions);
        const sdkImages = inputImages.map((file) =>
          Buffer.from(file.base64, 'base64'),
        );
        const { image } = await generateImage({
          model,
          prompt: hasInputImages
            ? { text: prompt, images: sdkImages }
            : prompt,
          providerOptions: {
            [resolvedProvider]: { ...sanitizedAdvancedOptions },
          },
        });
        return image;
      }
    }
  });
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

const generateImageUsingGenerateText = async ({
  model,
  prompt,
  inputImages,
}: {
  model: LanguageModel;
  prompt: string;
  inputImages: ApFile[];
}): Promise<GeneratedFile> => {
  const imageFiles = inputImages.map<ImagePart>((file) => {
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

  const result = await generateText({
    model,
    providerOptions: {
      google: { responseModalities: ['TEXT', 'IMAGE'] },
      openrouter: { modalities: ['image', 'text'] },
    },
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }, ...imageFiles],
      },
    ],
  });

  assertImageGenerationSuccess(result);

  return result.files[0];
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

const assertImageGenerationSuccess = (
  result: GenerateTextResult<ToolSet, never>
): void => {
  const responseBody =
    result.response.body &&
      typeof result.response.body === 'object' &&
      'candidates' in result.response.body
      ? result.response.body
      : { candidates: [] };

  const responseCandidates = Array.isArray(responseBody?.candidates)
    ? responseBody?.candidates
    : [];

  responseCandidates.forEach((candidate: { finishReason: string }) => {
    if (candidate.finishReason !== 'STOP') {
      throw new Error(
        'Image generation failed Reason:\n ' +
        JSON.stringify(responseCandidates, null, 2)
      );
    }
  });

  if (isNil(result.files) || result.files.length === 0) {
    throw new Error('No image generated');
  }
};
