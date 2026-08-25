import { Property, DropdownOption } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { ModelInfo } from '@anthropic-ai/sdk/resources';
import { claudeAuth } from '../auth';

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
  description:
    'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
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
      const options: DropdownOption<string>[] = models.map((model) => ({
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
