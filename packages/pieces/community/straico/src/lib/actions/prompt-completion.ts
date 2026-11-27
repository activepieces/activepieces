import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
  propsValidation,
} from '@activepieces/pieces-common';
import * as z from 'zod/mini'

import { baseUrlv1 } from '../common/common';

export const promptCompletion = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'prompt_completion',
  displayName: 'Ask AI',
  description:
    'Send a question or instruction to a Straico model and get a text reply.',
  aiMetadata: { description: 'Sends a single prompt to any chat model in the Straico catalog and returns the completion text, optionally grounding it in attached context: up to four file URLs, up to four YouTube video URLs and image URLs, with transcripts returned when requested. This is the general-purpose text action; prefer RAG Prompt Completion to search an indexed knowledge base, Agent Prompt Completion to reuse a saved persona, and Image Generation for pictures. Requires a model and a prompt; attached files and images must first be hosted by Upload File, and enabling transcripts without a file or YouTube URL fails. Not idempotent: each call spends credits and returns a fresh completion.', idempotent: false },
  propertyGroups: [
    {
      key: 'settings',
      display: 'section',
      label: 'Settings',
      icon: 'sliders',
      props: ['model', 'temperature', 'maxTokens'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['prompt'],
    },
    {
      key: 'attachments',
      display: 'section',
      label: 'Attachments',
      icon: 'paperclip',
      props: ['fileUrls', 'youtubeUrls', 'imageUrls', 'displayTranscripts'],
    },
  ],
  props: {
    model: Property.Dropdown({
  auth: straicoAuth,

      displayName: 'Model',
      required: true,
      description: 'The Straico chat model that writes the reply.',
      refreshers: [],
      defaultValue: 'openai/gpt-4o-mini',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Straico account first',
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
              token: auth.secret_text,
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
      displayName: 'Question',
      required: true,
      description: 'What you want the model to answer or do.',
      placeholder: 'e.g. Summarize this email in three bullet points',
    }),
    fileUrls: Property.Array({
      displayName: 'File URLs',
      required: false,
      description: 'Up to 4 file URLs, such as the output of Upload File.',
    }),
    youtubeUrls: Property.Array({
      displayName: 'YouTube URLs',
      required: false,
      description: 'Up to 4 YouTube video URLs for the model to watch.',
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      required: false,
      description: 'Image URLs for the model to look at, such as from Upload File.',
    }),
    displayTranscripts: Property.Checkbox({
      displayName: 'Return Transcripts',
      required: false,
      description: 'Also return the transcripts of the files or YouTube videos.',
      defaultValue: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      width: 'half',
      description: 'From 0 to 2. Lower is more focused, higher is more varied.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      width: 'half',
      description: 'Longest reply in tokens. Empty: model default.',
    }),
  },
  async run({ auth, propsValue }) {
    // Validate URLs length and displayTranscripts requirements
    await propsValidation.validateZod(propsValue, {
      fileUrls: z.array(z.string()).check(z.maxLength(4, 'Maximum 4 file URLs allowed')),
      youtubeUrls: z.array(z.string()).check(z.maxLength(4, 'Maximum 4 YouTube URLs allowed')),
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
        token: auth.secret_text,
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
