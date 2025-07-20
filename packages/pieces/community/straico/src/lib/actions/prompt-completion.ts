import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
  propsValidation,
} from '@activepieces/pieces-common';
import { z } from 'zod';

import { baseUrlv1 } from '../common/common';

export const promptCompletion = createAction({
  auth: straicoAuth,
  name: 'prompt_completion',
  displayName: 'Ask AI',
  description:
    'Enables users to generate prompt completion based on a specified model.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description:
        'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
      refreshers: [],
      defaultValue: 'openai/gpt-4o-mini',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const models = await httpClient.sendRequest<{
            data: {
              chat: Array<{
                name: string;
                model: string;
              }>;
            };
          }>({
            url: `${baseUrlv1}/models`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as string,
            },
          });
          return {
            disabled: false,
            options:
              models.body?.data?.chat?.map((model) => {
                return {
                  label: model.name,
                  value: model.model,
                };
              }) || [],
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models, API key is invalid",
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt text for which completions are requested',
    }),
    fileUrls: Property.Array({
      displayName: 'File URLs',
      required: false,
      description: 'URLs of files to be processed by the model (maximum 4 URLs), previously uploaded via the File Upload endpoint',
    }),
    youtubeUrls: Property.Array({
      displayName: 'YouTube URLs',
      required: false,
      description: 'URLs of YouTube videos to be processed by the model (maximum 4 URLs)',
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      required: false,
      description: 'URLs of images to be processed by the model, previously uploaded via the File Upload endpoint',
    }),
    displayTranscripts: Property.Checkbox({
      displayName: 'Display Transcripts',
      required: false,
      description: 'If true, returns transcripts of the files. Note: Either File URLs or YouTube URLs are required when this is enabled',
      defaultValue: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'This setting influences the variety in the model\'s responses (0-2)',
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      description: 'Set the limit for the number of tokens the model can generate in response',
    }),
  },
  async run({ auth, propsValue }) {
    // Validate URLs length and displayTranscripts requirements
    await propsValidation.validateZod(propsValue, {
      fileUrls: z.array(z.string()).max(4, 'Maximum 4 file URLs allowed'),
      youtubeUrls: z.array(z.string()).max(4, 'Maximum 4 YouTube URLs allowed'),
    });
    
    // Validate that displayTranscripts is only true when fileUrls or youtubeUrls are provided
    if (propsValue.displayTranscripts === true && 
        (!propsValue.fileUrls?.length && !propsValue.youtubeUrls?.length)) {
      throw new Error('Either File URLs or YouTube URLs are required when Display Transcripts is enabled');
    }

    const response = await httpClient.sendRequest<{
      data: {
        completions: {
          [key: string]: {
            completion: {
              choices: Array<{
                message: {
                  content: string;
                };
              }>;
            };
          };
        };
        transcripts: Array<{ text: string }>;
      };
    }>({
      url: `${baseUrlv1}/prompt/completion`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      body: {
        models: [propsValue.model],
        message: propsValue.prompt,
        ...(propsValue.fileUrls?.length ? { file_urls: propsValue.fileUrls } : {}),
        ...(propsValue.youtubeUrls?.length ? { youtube_urls: propsValue.youtubeUrls } : {}),
        ...(propsValue.imageUrls?.length ? { images: propsValue.imageUrls } : {}),
        ...((propsValue.displayTranscripts !== undefined && (propsValue.fileUrls?.length || propsValue.youtubeUrls?.length)) ? 
            { display_transcripts: propsValue.displayTranscripts } : {}),
        ...(propsValue.temperature !== undefined ? { temperature: propsValue.temperature } : {}),
        ...(propsValue.maxTokens !== undefined ? { max_tokens: propsValue.maxTokens } : {}),
      },
    });

    const modelResponse = response.body.data.completions[propsValue.model];
    return {
      content: modelResponse.completion.choices[0].message.content,
      transcripts: response.body.data?.transcripts || []
    };
  },
});
