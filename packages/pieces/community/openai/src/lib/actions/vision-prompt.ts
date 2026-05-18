import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const visionPrompt = createAction({
  auth: openaiAuth,
  name: 'vision_prompt',
  displayName: 'Vision Prompt',
  description: 'Ask GPT-4 Vision anything you want about an image!',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the OpenAI API. Default is https://api.openai.com/v1',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'The model to use for vision.',
      defaultValue: 'gpt-4o',
      options: {
        options: [
          { label: 'gpt-4o', value: 'gpt-4o' },
          { label: 'gpt-4-vision-preview', value: 'gpt-4-vision-preview' },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    detail: Property.StaticDropdown({
      displayName: 'Detail',
      required: false,
      description: 'The level of detail to use for the image.',
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Low', value: 'low' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
      defaultValue: 1,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: true,
      description:
        "The maximum number of tokens to generate. Requests can use up to 2,048 or 4,096 tokens shared between prompt and completion depending on the model. Don't set the value to maximum and leave some tokens for the input. (One token is roughly 4 characters for normal English text)",
      defaultValue: 2048,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
      defaultValue: 1,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
      defaultValue: 0,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the mode's likelihood to talk about new topics.",
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.number().min(0).max(1),
    });

    const openai = new OpenAI({
      apiKey: auth as string,
      baseURL: propsValue.baseUrl || undefined,
    });
    const {
      model,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      prompt,
      image,
      detail,
    } = propsValue;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${image.data.toString('base64')}`,
                detail: detail as any,
              },
            },
          ],
        },
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
    });

    return completion.choices[0].message.content;
  },
});
