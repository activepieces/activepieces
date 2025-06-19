import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import mime from 'mime-types';
import { claudeAuth } from '../..';
import { TextBlock } from '@anthropic-ai/sdk/resources';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { billingIssueMessage, unauthorizedMessage } from '../common/common';
const DEFAULT_TOKENS_FOR_THINKING_MODE=1024;
export const askClaude = createAction({
  auth: claudeAuth,
  name: 'ask_claude',
  displayName: 'Ask Claude',
  description: 'Ask Claude anything you want!',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description:
        'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
      defaultValue: 'claude-3-haiku-20240307',
      options: {
        disabled: false,
        options: [
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
          { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
          { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
          { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' },

        ],
      },
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      required: false,
      defaultValue: "You're a helpful assistant.",
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description:
        "The maximum number of tokens to generate. Requests can use up to 2,048 or 4,096 tokens shared between prompt and completion, don't set the value to maximum and leave some tokens for the input. The exact limit varies by model. (One token is roughly 4 characters for normal English text)",
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    image: Property.File({
      displayName: 'Image (URL)',
      required: false,
      description: 'URL of image to be used as input for the model.',
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description: `Array of roles to specify more accurate response.Please check [guide to Input Messages](https://docs.anthropic.com/en/api/messages-examples#vision).`,
    }),
    thinkingMode:Property.Checkbox({
      displayName:'Extended Thinking Mode',
      required:false,
      defaultValue:false,
      description:'Uses claude 3.7 sonnet enhanced reasoning capabilities for complex tasks.'
  }),
  thinkingModeParams:Property.DynamicProperties({
      displayName:'',
      refreshers:['thinkingMode'],
      required:false,
      props:async({auth,thinkingMode})=>{
          if(!auth || !thinkingMode) return {}

          const props:DynamicPropsValue={}

          props['budgetTokens'] = Property.Number({
              displayName:'Budget Tokens',
              required:true,
              defaultValue:DEFAULT_TOKENS_FOR_THINKING_MODE,
              description:'This parameter determines the maximum number of tokens Claude is allowed to use for its internal reasoning process.Your budget tokens must always be less than the max tokens specified.',

          })

          return props;

      }
  })
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.number().min(0).max(1.0).optional(),
    });

    const anthropic = new Anthropic({
      apiKey: auth,
    });
    let billingIssue = false;
    let unauthorized = false;
    let model = 'claude-3-haiku-20240307';

    if (propsValue.model) {
      model = propsValue.model;
    }
    let temperature = 0.5;
    if (propsValue.temperature) {
      temperature = Number(propsValue.temperature);
    }
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
    let response:string | undefined;
    while (retries < maxRetries) {
      try {

        if(propsValue.thinkingMode)
        {
          const budgetTokens = propsValue.thinkingModeParams ? propsValue.thinkingModeParams['budgetTokens'] :1024;

          const req = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: maxTokens,
            system: systemPrompt,
            thinking: {
              type: 'enabled',
              budget_tokens: budgetTokens ?? DEFAULT_TOKENS_FOR_THINKING_MODE,
            },
            messages: roles,
          });
  
          response = req.content.filter((block) => block.type === 'text')[0].text.trim()
        }
        else{
          const req = await anthropic?.messages.create({
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
            system: systemPrompt,
            messages: roles,
          });
  
          response = (req?.content[0] as TextBlock).text?.trim();
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
