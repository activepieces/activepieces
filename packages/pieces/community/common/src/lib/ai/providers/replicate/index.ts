import { Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import Replicate from 'replicate';
import { AI, AIChatRole, AIFactory } from '../..';
import { chatMapper, ChatModelMapper, imageMapper, ImageModelMapper, model, ModelType } from '../utils';

export const replicate: AIFactory = ({ proxyUrl, engineToken }): AI => {
  const sdk = new Replicate({
    auth: engineToken,
    baseUrl: `${proxyUrl}/v1`,
  });

  return {
    provider: 'replicate',
    image: {
      generate: async (params) => {
        const mapper = findMapper(params.model, ModelType.IMAGE) as ImageModelMapper;
        const modelOwner = params.model.split('/')[0];
        const modelName = params.model.split('/')[1];
        const versionId = params.model.split(':')[1];
        const prediction = await sdk.predictions.create({
          model: `${modelOwner}/${modelName}`,
          version: versionId,
          input: await mapper.encodeInput(params),
        });
        const result = await sdk.wait(prediction, { interval: 500, mode: "poll" });
        return mapper.decodeOutput(result.output);
      },
    },
    chat: {
      text: async (params) => {
        const mapper = findMapper(params.model, ModelType.CHAT) as ChatModelMapper;
        const modelOwner = params.model.split('/')[0];
        const modelName = params.model.split('/')[1];
        const versionId = params.model.split(':')[1];
        const prediction = await sdk.predictions.create({
          model: `${modelOwner}/${modelName}`,
          version: versionId,
          input: await mapper.encodeInput(params),
        });
        const result = await sdk.wait(prediction, { interval: 500, mode: "poll" });
        return mapper.decodeOutput(result.output);
      },
    },
  };
};

const commonImageMapper = imageMapper({
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

const llamaMapper = chatMapper({
  encodeInput: async (params) => {
    const concatenatedSystemMessage = params.messages
      .filter((message) => message.role === AIChatRole.SYSTEM)
      .map((message) => message.content)
      .join('\n');
    return {
      system_prompt: concatenatedSystemMessage,
      temperature: Math.tanh(params.creativity ?? 100),
      prompt: params.messages
        .filter((message) => message.role !== AIChatRole.SYSTEM)
        .map((message) => `${message.role}: ${message.content}`)
        .join('\n'),
      stop_sequences: params.stop,
      max_tokens: params.maxTokens,
    };
  },
  decodeOutput: async (output) => {
    const choices = output as Array<string>;
    return {
      choices: [{
        content: choices.join(""),
        role: AIChatRole.ASSISTANT,
      }],
    }
  },
});

const mistralMapper = chatMapper({
  encodeInput: async (params) => {
    const concatenatedSystemMessage = params.messages
      .filter((message) => message.role === AIChatRole.SYSTEM)
      .map((message) => message.content)
      .join('\n');
    return {
      system_prompt: concatenatedSystemMessage,
      temperature: Math.tanh(params.creativity ?? 100),
      prompt: params.messages
        .filter((message) => message.role !== AIChatRole.SYSTEM)
        .map((message) => `${message.role}: ${message.content}`)
        .join('\n'),
      stop_sequences: params.stop,
      max_new_tokens: params.maxTokens,
    };
  },
  decodeOutput: async (output) => {
    const choices = output as Array<string>;
    return {
      choices: [{
        content: choices.join(""),
        role: AIChatRole.ASSISTANT,
      }],
    }
  },
});

export const replicateModels = [
  model({
    label: "meta/meta-llama-3-70b-instruct",
    value: "meta/meta-llama-3-70b-instruct",
    supported: ['text']
  }).mapper(llamaMapper),
  model({
    label: "meta/meta-llama-3-8b-instruct",
    value: "meta/meta-llama-3-8b-instruct",
    supported: ['text']
  }).mapper(llamaMapper),
  model({
    label: "mistralai/mixtral-8x7b-instruct-v0.1",
    value: "mistralai/mixtral-8x7b-instruct-v0.1",
    supported: ['text']
  }).mapper(mistralMapper),
  model({
    label: "mistralai/mistral-7b-instruct-v0.2",
    value: "mistralai/mistral-7b-instruct-v0.2",
    supported: ['text']
  }).mapper(mistralMapper),
  model({ label: 'bytedance/sdxl-lightning-4step', value: 'bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637', supported: ['image'] })
    .mapper(commonImageMapper),
  model({ label: 'stability-ai/stable-diffusion', value: 'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', supported: ['image'] })
    .mapper(commonImageMapper),
  model({ label: 'black-forest-labs/flux-schnell', value: 'black-forest-labs/flux-schnell', supported: ['image'] })
    .mapper(imageMapper({
      advancedOptions: {},
      decodeOutput: commonImageMapper.decodeOutput,
      encodeInput: async (params) => {
        const commonParams = await commonImageMapper.encodeInput(params) as any;
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

const findMapper = (model: string, type: ModelType) => {
  const mapper = replicateModels.find(m => m.value === model)?.mapper;
  if (isNil(mapper) || mapper.__tag !== type) {
    throw new Error(`${type} model ${model} not found`);
  }
  return mapper;
};