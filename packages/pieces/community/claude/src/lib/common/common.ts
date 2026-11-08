import { Property, DropdownOption } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { ModelInfo } from '@anthropic-ai/sdk/resources';
import { claudeAuth } from '../auth';

const RETIRED_MODEL_REPLACEMENTS: Record<string, string> = {
  'claude-sonnet-4-5': 'claude-sonnet-5-5',
  'claude-sonnet-4-5-20250929': 'claude-sonnet-5-5',
  'claude-sonnet-4-20250514': 'claude-sonnet-5-5',
  'claude-sonnet-4-0': 'claude-sonnet-5-5',
  'claude-3-7-sonnet-20250219': 'claude-sonnet-5-5',
  'claude-3-7-sonnet-latest': 'claude-sonnet-5-5',
  'claude-3-5-sonnet-20241022': 'claude-sonnet-5-5',
  'claude-3-5-sonnet-20240620': 'claude-sonnet-5-5',
  'claude-3-5-sonnet-latest': 'claude-sonnet-5-5',
  'claude-3-sonnet-20240229': 'claude-sonnet-5-5',
  'claude-opus-4-1-20250805': 'claude-opus-5-5',
  'claude-opus-4-1': 'claude-opus-5-5',
  'claude-opus-4-20250514': 'claude-opus-5-5',
  'claude-opus-4-0': 'claude-opus-5-5',
  'claude-3-opus-20240229': 'claude-opus-5-5',
  'claude-3-opus-latest': 'claude-opus-5-5',
  'claude-3-5-haiku-20241022': 'claude-haiku-5-5',
  'claude-3-5-haiku-latest': 'claude-haiku-5-5',
  'claude-3-haiku-20240307': 'claude-haiku-5-5',
  'claude-2.1': 'claude-sonnet-5-5',
  'claude-2.0': 'claude-sonnet-5-5',
};

export function resolveModelId(model: string | undefined | null): string {
  if (!model) {
    return DEFAULT_MODEL;
  }
  return RETIRED_MODEL_REPLACEMENTS[model] ?? model;
}

export function isRetiredModel(model: string): boolean {
  return model in RETIRED_MODEL_REPLACEMENTS;
}

const NO_FORCED_TOOL_CHOICE_PREFIXES = [
  'claude-fable-5-1',
  'claude-mythos-5-1',
  'claude-opus-5-5',
  'claude-sonnet-5-5',
];

const TEMPERATURE_MODEL_PREFIXES = [
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-opus-4-5',
  'claude-haiku-4-5',
  'claude-sonnet-4-5',
  'claude-sonnet-4-0',
  'claude-sonnet-4-2025',
  'claude-opus-4-1',
  'claude-opus-4-0',
  'claude-opus-4-2025',
  'claude-3-',
  'claude-2',
  'claude-instant',
];

const DEFAULT_THINKING_MODEL_PREFIXES = [
  'claude-opus-5-5',
  'claude-sonnet-5-5',
  'claude-haiku-5-5',
];

function normalizeModelId(model: string): string {
  return model.toLowerCase().replace(/\./g, '-');
}

function matchesAnyPrefix({
  model,
  prefixes,
}: {
  model: string;
  prefixes: string[];
}): boolean {
  const id = normalizeModelId(model);
  return prefixes.some((prefix) => id.startsWith(prefix));
}

export function supportsForcedToolChoice(model: string): boolean {
  return !matchesAnyPrefix({ model, prefixes: NO_FORCED_TOOL_CHOICE_PREFIXES });
}

export function supportsTemperature(model: string): boolean {
  return matchesAnyPrefix({ model, prefixes: TEMPERATURE_MODEL_PREFIXES });
}

export function thinksByDefault(model: string): boolean {
  return matchesAnyPrefix({ model, prefixes: DEFAULT_THINKING_MODEL_PREFIXES });
}

export function lowEffortConfig(model: string): LowEffortConfig {
  return thinksByDefault(model) ? { output_config: { effort: 'low' } } : {};
}

export const baseUrl = 'https://api.anthropic.com/v1';

export const billingIssueMessage = `Error Occurred: 429 \n

1. Ensure that you have enough tokens on your Anthropic platform. \n
2. Generate a new API key. \n
3. Attempt the process again. \n

For guidance, visit: https://console.anthropic.com/settings/plans`;

export const unauthorizedMessage = `Error Occurred: 401 \n

Ensure that your API key is valid. \n
`;

export const modelDropdown = Property.Dropdown({
  auth: claudeAuth,
  displayName: 'Model',
  description: 'The Claude model to use. Newest models are listed first.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Enter your API key first',
        options: [],
      };
    }
    try {
      const anthropic = new Anthropic({ apiKey: auth.secret_text });
      const models: ModelInfo[] = [];
      for await (const model of anthropic.models.list({ limit: 1000 })) {
        models.push(model);
      }
      models.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const options: DropdownOption<string>[] = models
        .filter((model) => !isRetiredModel(model.id))
        .map((model) => ({
        label: model.display_name ?? model.id,
        value: model.id,
      }));
      return {
        disabled: false,
        options,
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load models, check your API key or try again.",
      };
    }
  },
});

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
export const THINKING_MODEL = 'claude-sonnet-5-5';

export type LowEffortConfig = { output_config?: { effort: 'low' } };
export type ClaudeMessageParams =
  Anthropic.Messages.MessageCreateParamsNonStreaming & LowEffortConfig;
