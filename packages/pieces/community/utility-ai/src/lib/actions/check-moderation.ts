import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil, SeekPage } from '@activepieces/shared';
import { AI_USAGE_FEATURE_HEADER, AIProviderWithoutSensitiveData, AIUsageFeature } from '@activepieces/common-ai';
import OpenAI from 'openai';
import { ModerationMultiModalInput } from 'openai/resources/moderations';

export const checkModeration = createAction({
  name: 'checkModeration',
  displayName: 'Check Moderation',
  description:
    'Classifies if text or image contains hate, hate/threatening, self-harm, sexual, sexual/minors, violence, or violence/graphic content.',
  props: {
    provider: Property.Dropdown<string, true>({
      displayName: 'Provider',
      required: true,
      refreshers: [],
      options: async (_, ctx) => {
          const { body: { data: supportedProviders } } = await httpClient.sendRequest<
              SeekPage<AIProviderWithoutSensitiveData>
          >({
              method: HttpMethod.GET,
              url: `${ctx.server.apiUrl}v1/ai-providers`,
              headers: {
                  Authorization: `Bearer ${ctx.server.token}`,
              },
          });

          const openaiProvider = supportedProviders.find(provider => provider.provider === 'openai');

          return {
              placeholder: openaiProvider ? 'Select AI Provider' : `No OpenAI providers available for moderation`,
              disabled: !openaiProvider,
              options: openaiProvider ? [
                {
                  value: openaiProvider.provider,
                  label: openaiProvider.provider
                }
              ] : [],
          };
      },
  }),
  model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      defaultValue: 'omni-moderation-latest',
      refreshers: ['provider'],
      options: async (propsValue) => {
          const provider = propsValue['provider'] as string;
          if (isNil(provider)) {
              return {
                  disabled: true,
                  options: [],
                  placeholder: 'Select AI Provider',
              };
          }

          const openaiModerationModels = [
            {
              label: 'omni-moderation-latest',
              value: 'omni-moderation-latest',
            },
          ];

          return {
              placeholder: 'Select AI Model',
              disabled: false,
              options: openaiModerationModels,
          };
      },
  }),
    text: Property.LongText({
      displayName: 'Text',
      required: false,
    }),
    images: Property.Array({
      displayName: 'Images',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'Image File',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;
    const text = context.propsValue.text;
    const images = (context.propsValue.images as Array<{ file: ApFile }>) ?? [];

    const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}/v1`;
    const engineToken = context.server.token;

    if (!text && !images.length) {
      throw new Error('Please provide text or images to check moderation');
    }

    const client = new OpenAI({
      apiKey: engineToken,
      baseURL,
      defaultHeaders: {
        [AI_USAGE_FEATURE_HEADER]: AIUsageFeature.UTILITY_AI,
      },
    });

    const input: ModerationMultiModalInput[] = [];

    if (text) { 
      input.push({ type: 'text', text });
    }

    for (const image of images) {
      input.push({
        type: 'image_url',
        image_url: {
          url: `data:image/${image.file.extension};base64,${image.file.base64}`,
        },
      });
    }

    const moderation = await client.moderations.create({
      input,
      model: context.propsValue.model,
    });

    return moderation.results[0];
  },
});
