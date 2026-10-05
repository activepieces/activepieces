import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import mime from 'mime-types';
import { openaiAuth } from '../auth';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const visionPrompt = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'vision_prompt',
  classification: 'READ',
  displayName: 'Vision Prompt',
  description: 'Ask a question about an image and get a text reply.',
  aiMetadata: { description: 'Answers a question about an image by sending the uploaded picture inline with the prompt to gpt-4o, covering captioning, reading text off an image, and visual question answering. It is the only action here that accepts image input, so pick it over ask_chatgpt whenever a picture is part of the question, and generate_image or edit_image when the goal is producing an image instead. The model is fixed at gpt-4o and the image is embedded as base64 in the request, so keep it small; a detail setting trades cost against fidelity. Not idempotent: each call produces a fresh completion.', idempotent: false },
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'The picture to ask about.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What you want to know about the image.',
      placeholder: 'e.g. What is the total on this receipt?',
      required: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'Longest reply in tokens, about 4 characters each.',
      defaultValue: 2048,
    }),
    detail: Property.Dropdown({
      auth: openaiAuth,
      displayName: 'Detail',
      required: false,
      description: 'Low is faster and cheaper. High reads small details better.',
      defaultValue: 'auto',
      advanced: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            {
              label: 'Auto',
              value: 'auto',
            },
            {
              label: 'Low',
              value: 'low',
            },
            {
              label: 'High',
              value: 'high',
            },
          ],
        };
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'From 0 to 2. Lower is more focused, higher is more varied.',
      defaultValue: 0.9,
      advanced: true,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description: 'From 0 to 1. Adjust this or Temperature, not both.',
      defaultValue: 1,
      advanced: true,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency Penalty',
      required: false,
      description:
        'From -2 to 2. Higher values make the model repeat itself less.',
      defaultValue: 0,
      advanced: true,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence Penalty',
      required: false,
      description:
        'From -2 to 2. Higher values push the model toward new topics.',
      defaultValue: 0.6,
      advanced: true,
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description:
        'Messages sent before the question, such as a system instruction.',
      advanced: true,
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
      ],
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.optional(z.number().check(z.minimum(0), z.maximum(2))),
    });

    const openai = new OpenAI({
      apiKey: auth.secret_text,
    });
    const { temperature, maxTokens, topP, frequencyPenalty, presencePenalty } =
      propsValue;

    const rolesArray = propsValue.roles ? (propsValue.roles as any) : [];
    const roles = rolesArray.map((item: any) => {
      const rolesEnum = ['system', 'user', 'assistant'];
      if (!rolesEnum.includes(item.role)) {
        throw new Error(
          'The only available roles are: [system, user, assistant]'
        );
      }

      return {
        role: item.role,
        content: item.content,
      };
    });

    const imageExtension = propsValue.image.extension;
    const imageMimeType =
      mime.lookup(imageExtension ?? '') || `image/${imageExtension}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...roles,
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: propsValue['prompt'],
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMimeType};base64,${propsValue.image.base64}`,
                detail: toImageDetail(propsValue.detail),
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

function toImageDetail(value: unknown): ImageDetail {
  if (value === 'auto' || value === 'low' || value === 'high') {
    return value;
  }
  return 'auto';
}

type ImageDetail = 'auto' | 'low' | 'high';
