import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import type { PerplexityAiAgentResponse } from '../../../common/types';

const REASONING_EFFORTS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

export const createAgentResponseAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_create_agent_response',
  displayName: 'Create Agent Response',
  description:
    'Generate a response with the Perplexity Agent API, optionally using web search and other tools.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs one Agent API request: a model (or fallback chain, or a preset effort level) answers the input, calling any tools given (web_search, fetch_url, finance_search and others) and returns the completed response with its id, output items and token usage. Set at least one of Model, Models or Effort; use List Models for model ids. Anthropic models need Max Output Tokens. With Background set, it returns at once with status "queued": poll it with Get Agent Response and stop it with Cancel Agent Response. Pass a completed response id as Previous Response ID to continue a conversation. Not idempotent: every call runs and bills a new response.',
    idempotent: false,
  },
  props: {
    input: Property.LongText({
      displayName: 'Input',
      description: 'The question or task for the model.',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description:
        'Model id in provider/model form, e.g. "openai/gpt-6-luna" or "perplexity/sonar". Use List Models for the available ids. Set this, Models or Effort.',
      required: false,
    }),
    models: Property.Array({
      displayName: 'Models',
      description:
        'Fallback chain of up to 5 model ids, tried in order until one succeeds. Takes precedence over Model.',
      required: false,
    }),
    effort: Property.ShortText({
      displayName: 'Effort',
      description:
        'Preset effort level that picks the model, system prompt and search settings, e.g. "fast", "low", "medium" or "high", optionally pinned as "name@<version>". Cannot be combined with Profile.',
      required: false,
    }),
    profile: Property.ShortText({
      displayName: 'Profile',
      description:
        'Saved, versioned configuration to run with. Cannot be combined with Effort.',
      required: false,
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'System instructions for the model.',
      required: false,
    }),
    tools: Property.Json({
      displayName: 'Tools',
      description:
        'Array of tools the model may call, each an object with a "type": web_search, image_search, finance_search, people_search, fetch_url, function, sandbox, mcp or connector, e.g. [{"type":"web_search"}]. Each tool call is billed. Omit for no tools.',
      required: false,
    }),
    toolChoice: Property.Json({
      displayName: 'Tool Choice',
      description:
        'Tool choice strategy, e.g. {"type":"image_search"} to force image search.',
      required: false,
    }),
    skills: Property.Json({
      displayName: 'Skills',
      description:
        'Array of skills available to the model, e.g. [{"type":"custom","name":"<skill name>"}] for a skill from List Skills. Selecting any skill enables the billed sandbox tool.',
      required: false,
    }),
    previousResponseId: Property.ShortText({
      displayName: 'Previous Response ID',
      description:
        'Id of a completed response from this action or Get Agent Response, to continue that conversation.',
      required: false,
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Output Tokens',
      description:
        'Maximum tokens to generate. Required for anthropic/* models.',
      required: false,
    }),
    maxSteps: Property.Number({
      displayName: 'Max Steps',
      description:
        "Maximum research loop steps. Defaults to 1 for a direct model, or the effort level's own value.",
      required: false,
    }),
    reasoningEffort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      description:
        'How much the model reasons before answering, for models that support it.',
      required: false,
      options: {
        disabled: false,
        options: REASONING_EFFORTS.map((value) => ({ label: value, value })),
      },
    }),
    responseFormat: Property.Json({
      displayName: 'Response Format',
      description:
        'Desired output format, e.g. {"type":"json_schema","json_schema":{"name":"answer","schema":{...}}}.',
      required: false,
    }),
    languagePreference: Property.ShortText({
      displayName: 'Language',
      description: 'ISO 639-1 code of the language to answer in, e.g. "en".',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature.',
      required: false,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling parameter.',
      required: false,
    }),
    background: Property.StaticDropdown({
      displayName: 'Background',
      description:
        '"true" returns at once with status "queued"; poll with Get Agent Response. Defaults to "false", which waits for the answer.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),
    store: Property.StaticDropdown({
      displayName: 'Store',
      description:
        '"false" hides the response from Get Agent Response. Defaults to "true".',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    return await perplexityAiClient.request<PerplexityAiAgentResponse>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/agent',
      body: {
        input: p.input,
        model: p.model,
        models: p.models && p.models.length > 0 ? p.models : undefined,
        effort: p.effort,
        profile: p.profile,
        instructions: p.instructions,
        tools: p.tools,
        tool_choice: p.toolChoice,
        skills: p.skills,
        previous_response_id: p.previousResponseId,
        max_output_tokens: p.maxOutputTokens,
        max_steps: p.maxSteps,
        reasoning:
          p.reasoningEffort === undefined
            ? undefined
            : { effort: p.reasoningEffort },
        response_format: p.responseFormat,
        language_preference: p.languagePreference,
        temperature: p.temperature,
        top_p: p.topP,
        background: toBoolean({ value: p.background }),
        store: toBoolean({ value: p.store }),
        stream: false,
      },
    });
  },
});

function toBoolean({
  value,
}: {
  value: string | undefined;
}): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}
