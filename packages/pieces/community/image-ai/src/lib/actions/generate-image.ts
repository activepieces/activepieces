import { createAction, Property } from '@activepieces/pieces-framework';
import { AIUsageFeature, createAIModel, SUPPORTED_AI_PROVIDERS } from '@activepieces/common-ai';
import { ImageModel } from 'ai';
import { experimental_generateImage as generateImage } from 'ai';
import { aiProps } from '@activepieces/common-ai';

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
    const model = createAIModel({
      providerName,
      modelInstance,
      engineToken,
      baseURL,
      metadata: {
        feature: AIUsageFeature.IMAGE_AI,
      },
    });

    const response = await generateImage({
      model,
      prompt: context.propsValue.prompt,
      providerOptions: {
        [providerName]: {
          ...context.propsValue.advancedOptions,
        },
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
