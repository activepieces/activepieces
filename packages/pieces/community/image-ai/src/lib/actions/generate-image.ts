import { aiProps } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { createAIProvider, SUPPORTED_AI_PROVIDERS } from '@activepieces/shared';
import { ImageModel } from 'ai';
import { experimental_generateImage as generateImage } from 'ai';

export const generateImageAction = createAction({
  name: 'generateImage',
  displayName: 'Generate Image',
  description: '',
  props: {
    provider: aiProps({ modelType: 'image' }).provider,
    model: aiProps({ modelType: 'image' }).model,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    advancedOptions: aiProps({ modelType: 'image' }).advancedOptions,
    resolution: Property.Dropdown({
      displayName: 'Resolution',
      description: 'The resolution to generate the image in.',
      required: true,
      refreshers: ['model'],
      defaultValue: '1024x1024',
      options: async (propsValue) => {
        const model = propsValue['model'] as ImageModel;

        let options = [
          {
            label: '1024x1024',
            value: '1024x1024',
          },
          {
            label: '512x512',
            value: '512x512',
          },
          {
            label: '256x256',
            value: '256x256',
          },
        ];
        if (model.modelId == 'dall-e-3')
          options = [
            {
              label: '1024x1024',
              value: '1024x1024',
            },
            {
              label: '1024x1792',
              value: '1024x1792',
            },
            {
              label: '1792x1024',
              value: '1792x1024',
            },
          ];

        return {
          options: options,
        };
      },
    }),
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;
    const modelInstance = context.propsValue.model as ImageModel;

    const providerConfig = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerName);
    if (!providerConfig) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
    const engineToken = context.server.token;
    const provider = createAIProvider({
      providerName,
      modelInstance,
      apiKey: engineToken,
      baseURL,
    });

    const response = await generateImage({
      model: provider,
      prompt: context.propsValue.prompt,
      size: context.propsValue.resolution as `${number}x${number}`,
      providerOptions: {
        ...context.propsValue.advancedOptions,
      },
      headers: {
        'Authorization': `Bearer ${engineToken}`,
      },
    });

    if (response.image.base64) {
      return context.files.write({
        data: Buffer.from(response.image.base64, 'base64'),
        fileName: 'image.png',
      });
    } else {
      return context.files.write({
        data: Buffer.from(response.image.uint8Array),
        fileName: 'image.png',
      });
    }
  },
});
