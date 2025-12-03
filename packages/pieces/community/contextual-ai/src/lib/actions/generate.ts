import { createAction, Property } from "@activepieces/pieces-framework";
import { contextualAiAuth } from "../../index";
import { ContextualAI } from 'contextual-client';

export const generateAction = createAction({
  auth: contextualAiAuth,
  name: 'generate',
  displayName: 'Generate Text',
  description: 'Generate text using Contextual AI\'s Grounded Language Model',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The text prompt to generate a response for',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model Version',
      description: 'The version of Contextual\'s GLM to use',
      required: true,
      options: {
        options: [
          { label: 'GLM v2', value: 'v2' },
          { label: 'GLM v1', value: 'v1' },
        ],
      },
      defaultValue: 'v2',
    }),
    knowledge: Property.Array({
      displayName: 'Knowledge Sources',
      description: 'Optional knowledge sources to ground the generation (leave empty for general generation)',
      required: false,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      description: 'Optional system instructions for the model',
      required: false,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum number of tokens to generate (default: 1024)',
      required: false,
      defaultValue: 1024,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature (0.0 to 1.0, lower = more focused, higher = more creative)',
      required: false,
      defaultValue: 0.7,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling parameter (0.0 to 1.0)',
      required: false,
      defaultValue: 0.9,
    }),
    avoidCommentary: Property.Checkbox({
      displayName: 'Avoid Commentary',
      description: 'Avoid providing additional conversational commentary not grounded in context',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, baseUrl } = auth.props;
    const {
      prompt,
      model,
      knowledge,
      systemPrompt,
      maxTokens,
      temperature,
      topP,
      avoidCommentary,
    } = propsValue;

    const client = new ContextualAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.contextual.ai/v1',
    });

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: prompt },
    ];

    const response = await client.generate.create({
      messages,
      model,
      knowledge: (knowledge || []) as string[],
      system_prompt: systemPrompt,
      max_new_tokens: maxTokens,
      temperature,
      top_p: topP,
      avoid_commentary: avoidCommentary,
    });

    return {
      response: response.response,
    };
  },
});
