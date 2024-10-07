import { Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import Replicate from 'replicate';
import { AI, AIFactory } from '@activepieces/pieces-common';
import { ChatModelCodec, imageCodec, ImageModelCodec, model } from '../utils';

export const replicate: AIFactory = ({ proxyUrl, engineToken }): AI => {
  const sdk = new Replicate({
    auth: engineToken,
    baseUrl: `${proxyUrl}/v1`,
  });

  const findCodec = (model: string, type: 'image' | 'chat') => {
    const codec = replicateModels.find(m => m.value === model)?.codec;
    if (isNil(codec) || codec.__tag !== `${type}-codec`) {
      throw new Error(`Replicate ${type} model ${model} not found`);
    }
    return codec;
  };

  return {
    provider: 'replicate',
    image: {
      generate: async (params) => {
        const codec = findCodec(params.model, 'image') as ImageModelCodec;
        const modelOwner = params.model.split('/')[0];
        const modelName = params.model.split('/')[1];
        const versionId = params.model.split(':')[1];
        const prediction = await sdk.predictions.create({
          model: `${modelOwner}/${modelName}`,
          version: versionId,
          input: await codec.encodeInput(params),
        });
        const result = await sdk.wait(prediction, { interval: 500, mode: "poll" });
        return codec.decodeOutput(result.output);
      },
    },
    chat: {
      text: async (params) => {
        const codec = findCodec(params.model, 'chat') as ChatModelCodec;
        const modelOwner = params.model.split('/')[0];
        const modelName = params.model.split('/')[1];
        const versionId = params.model.split(':')[1];
        const prediction = await sdk.predictions.create({
          model: `${modelOwner}/${modelName}`,
          version: versionId,
          input: await codec.encodeInput(params),
        });
        const result = await sdk.wait(prediction, { interval: 500, mode: "poll" });
        return codec.decodeOutput(result.output);
      },
    },
  };
};

// TODO: Support "advanced" params per model such that each model can have its own "advanced" params as action properties
const commonImageCodec = imageCodec({
  encodeInput: async (params) => {
    const [width, height] = params.size?.split('x').map(Number) ?? [512, 512];
    const negativePrompt = params.advancedOptions?.['negativePrompt'] ?? null;
    return {
      prompt: params.prompt,
      negative_prompt: negativePrompt,
      width,
      height,
      num_outputs: 1,
    };
  },
  decodeOutput: async (output) => {
    const imageUrls = output as Array<string>;
    const imageUrl = imageUrls[0];
    const image = await fetch(imageUrl);
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    return {
      image: imageBase64,
    };
  },
  advancedOptions: {
    negativePrompt: Property.ShortText({
      displayName: 'Negative Prompt',
      required: true,
      description: 'A prompt to avoid in the generated image.',
    }),
  }
})

export const replicateModels = [
  model({ label: 'bytedance/sdxl-lightning-4step', value: 'bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637', supported: ['image'] })
    .codec(commonImageCodec),
  model({ label: 'stability-ai/stable-diffusion', value: 'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', supported: ['image'] })
    .codec(commonImageCodec),
  model({ label: 'black-forest-labs/flux-schnell', value: 'black-forest-labs/flux-schnell', supported: ['image'] })
    .codec(imageCodec({
      advancedOptions: {},
      decodeOutput: commonImageCodec.decodeOutput,
      encodeInput: async (params) => {
        const commonParams = await commonImageCodec.encodeInput(params) as any;
        const width = commonParams.width as number;
        const height = commonParams.height as number;
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        const aspectRatio = `${width / divisor}:${height / divisor}`;
        return {
          ...commonParams,
          megapixels: "1",
          aspect_ratio: aspectRatio,
          output_format: "png",
        };
      },
    })),
]