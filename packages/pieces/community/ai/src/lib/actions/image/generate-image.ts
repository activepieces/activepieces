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
  ToolSet,
} from 'ai';
import { experimental_generateImage as generateImage } from 'ai';
import { LanguageModelV2 } from '@ai-sdk/provider';
import mime from 'mime-types';
import { isNil } from '@activepieces/shared';
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
    advancedOptions: Property.DynamicProperties({
      displayName: 'Advanced Options',
      required: false,
      auth: PieceAuth.None(),
      refreshers: ['provider', 'model'],
      props: async (propsValue): Promise<InputPropertyMap> => {
        const providerId = propsValue['provider'] as unknown as string;
        const modelId = propsValue['model'] as unknown as string;

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

        if (
          providerId === AIProviderName.GOOGLE &&
          modelId === 'gemini-2.5-flash-image-preview'
        ) {
          options = {
            image: Property.Array({
              displayName: 'Images',
              required: false,
              properties: {
                file: Property.File({
                  displayName: 'Image File',
                  required: true,
                }),
              },
              description: 'The image(s) you want to edit/merge',
            }),
          };
        }

        return options;
      },
    }),
  },
  async run(context) {
    const provider = context.propsValue.provider;
    const modelId = context.propsValue.model;

    const image = await getGeneratedImage({
      provider: provider as AIProviderName,
      modelId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      prompt: context.propsValue.prompt,
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

const getGeneratedImage = async ({
  provider,
  modelId,
  engineToken,
  apiUrl,
  prompt,
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

  switch (provider) {
    case AIProviderName.GOOGLE:
    case AIProviderName.ACTIVEPIECES:
    case AIProviderName.OPENROUTER:
    case AIProviderName.CLOUDFLARE_GATEWAY:
      return generateImageUsingGenerateText({
        model: model as unknown as LanguageModelV2,
        prompt,
        advancedOptions,
      });
    default: {
      const { image } = await generateImage({
        model,
        prompt,
        providerOptions: {
          [provider]: { ...advancedOptions },
        },
      });
      return image
    };
  }
};

const generateImageUsingGenerateText = async ({
  model,
  prompt,
  advancedOptions,
}: {
  model: LanguageModelV2;
  prompt: string;
  advancedOptions?: DynamicPropsValue;
}): Promise<GeneratedFile> => {
  const images =
    (advancedOptions?.['image'] as Array<{ file: ApFile }> | undefined) ?? [];

  const imageFiles = images.map<ImagePart>((image) => {
    const fileType = image.file.extension
      ? mime.lookup(image.file.extension)
      : 'image/jpeg';

    return {
      type: 'image',
      image: `data:${fileType};base64,${image.file.base64}`,
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
