import { createAction, Property } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import mime from 'mime-types';
import { claudeAuth } from '../auth';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { spreadIfDefined } from '@activepieces/pieces-framework';
import {
  billingIssueMessage,
  ClaudeMessageParams,
  lowEffortConfig,
  modelDropdown,
  resolveModelId,
  supportsTemperature,
  THINKING_MODEL,
  unauthorizedMessage,
} from '../common/common';
import { askClaudeActionOutputSchema } from '../output-schemas';
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractReplyText(message: Anthropic.Messages.Message): string {
  const text = message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('\n')
    .trim();
  if (text.length === 0) {
    throw new Error(
      `Claude returned no text (stop_reason: ${message.stop_reason ?? 'unknown'}). Try raising Max Tokens or rephrasing the prompt.`
    );
  }
  return text;
}

export const askClaude = createAction({
  audience: 'both',
  auth: claudeAuth,
  name: 'ask_claude',
  classification: 'READ',
  displayName: 'Ask Claude',
  description: 'Send a question or instruction to Claude and get a text reply.',
  aiMetadata: { description: 'Sends a free-form question or instruction to a chosen Anthropic Claude model and returns the reply as plain text, optionally with an image attached for vision and earlier user/assistant turns supplied as Roles for multi-turn context; enabling Extended Thinking Mode routes the call to Claude Sonnet 5.5 with adaptive thinking. Prefer the sibling Extract Structured Data action when the answer must be constrained to defined fields rather than prose. Requires a model and a question, with temperature between 0 and 1; not idempotent, since each call is a fresh generation that can return different text.', idempotent: false },
  propertyGroups: [
    { key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['model', 'maxTokens'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['prompt', 'systemPrompt', 'image'] },
  ],
  props: {
    model: modelDropdown,
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What you want Claude to answer or do.',
      required: true,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      description:
        'Standing instructions, such as a role or tone, for Claude to follow.',
      required: false,
      defaultValue: "You're a helpful assistant.",
    }),
    image: Property.File({
      displayName: 'Image',
      required: false,
      description: 'An image for Claude to look at along with your question.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description:
        'Longest reply in tokens, about 4 characters each. Empty: 1,000.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      advanced: true,
      description: 'From 0 to 1, lower is more focused. Newer models ignore it.',
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      advanced: true,
      defaultValue: [],
      description:
        'Extra messages sent after the question, as user or assistant turns.',
    }),
    thinkingMode: Property.Checkbox({
      displayName: 'Extended Thinking Mode',
      required: false,
      advanced: true,
      defaultValue: false,
      description:
        'Lets Claude reason first. Uses Claude Sonnet 5.5, regardless of Model.',
    }),
    thinkingModeParams: Property.DynamicProperties({
      auth: claudeAuth,
      displayName: '',
      refreshers: ['thinkingMode'],
      required: false,
      advanced: true,
      props: async () => ({}),
    }),
  },
  outputSchema: askClaudeActionOutputSchema,
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.optional(z.number().check(z.minimum(0), z.maximum(1.0))),
    });

    const anthropic = new Anthropic({
      apiKey: auth.secret_text,
    });
    let billingIssue = false;
    let unauthorized = false;
    const model = resolveModelId(propsValue.model);
    const temperature = isNil(propsValue.temperature) || !supportsTemperature(model)
      ? undefined
      : Number(propsValue.temperature);
    let maxTokens = 1000;
    if (propsValue.maxTokens) {
      maxTokens = Number(propsValue.maxTokens);
    }
    let systemPrompt = 'You are a helpful assistant.';
    if (propsValue.systemPrompt) {
      systemPrompt = propsValue.systemPrompt;
    }

    type Content =
      | { type: 'text'; text: string }
      | {
          type: 'image';
          source: { type: 'base64'; media_type: string; data: string };
        };
    const rolesArray = propsValue.roles
      ? (propsValue.roles as unknown as Array<Content>)
      : [];

    const rolesEnum = ['user', 'assistant'];
    const roles = rolesArray.map((item: any) => {
      if (!rolesEnum.includes(item.role)) {
        throw new Error('The only available roles are: [user, assistant]');
      }
      return item;
    });

    const defaultMimeType = 'image/jpeg';
    roles.unshift({
      role: 'user',
      content: [
        {
          type: 'text',
          text: propsValue['prompt'],
        },
        ...(propsValue.image
          ? [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: propsValue.image.extension
                    ? mime.lookup(propsValue.image.extension) || defaultMimeType
                    : defaultMimeType,
                  data: propsValue.image.base64,
                },
              },
            ]
          : []),
      ],
    });

    const maxRetries = 4;
    let retries = 0;
    let response: string | undefined;
    while (retries < maxRetries) {
      try {
        if (propsValue.thinkingMode) {
          const req = await anthropic.messages.create({
            model: THINKING_MODEL,
            max_tokens: maxTokens,
            system: systemPrompt,
            thinking: { type: 'adaptive' },
            messages: roles,
          } as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming);

          response = extractReplyText(req);
        } else {
          const params: ClaudeMessageParams = {
            model: model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: roles,
            ...spreadIfDefined('temperature', temperature),
            ...lowEffortConfig(model),
          };
          const req = await anthropic.messages.create(params);

          response = extractReplyText(req);
        }

        break; // Break out of the loop if the request is successful
      } catch (e: any) {
        if (e?.type?.includes('rate_limit_error')) {
          billingIssue = true;
          if (retries + 1 === maxRetries) {
            throw e;
          }
          // Calculate the time delay for the next retry using exponential backoff
          const delay = Math.pow(6, retries) * 1000;
          console.log(`Retrying in ${delay} milliseconds...`);
          await sleep(delay); // Wait for the calculated delay
          retries++;
          break;
        } else {
          if (e?.error?.type?.includes('not_found_error')) {
            unauthorized = true;
            throw e;
          }
          const new_error = e as {
            type: string;
            error: {
              type: string;
              message: string;
            };
          };
          throw e;
          // throw {
          //   error: new_error.error.message,
          // };
        }
      }
    }
    if (billingIssue) {
      throw new Error(billingIssueMessage);
    }
    if (unauthorized) {
      throw new Error(unauthorizedMessage);
    }
    return response;
  },
});
