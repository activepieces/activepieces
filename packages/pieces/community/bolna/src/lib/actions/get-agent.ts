import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bolnaaiAuth } from '../common/auth';
import { bolnaClient } from '../common/client';
import { bolnaSchemas } from '../common/schemas';

const PROMPT_EXCERPT_LENGTH = 1000;

export const getAgent = createAction({
  auth: bolnaaiAuth,
  name: 'get_agent',
  displayName: 'Get Agent',
  description: 'Get the configuration summary of a Bolna agent.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: {
    fields: [
      { key: 'id', label: 'Agent ID' },
      { key: 'agent_name', label: 'Agent Name' },
      { key: 'agent_type', label: 'Agent Type' },
      { key: 'agent_status', label: 'Agent Status' },
      { key: 'agent_welcome_message', label: 'Welcome Message' },
      { key: 'webhook_url', label: 'Webhook URL', format: 'url' },
      { key: 'prompt_excerpt', label: 'Prompt Excerpt' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    ],
  },
  aiMetadata: {
    description:
      'Fetches one Bolna agent by ID and returns its name, type, status, welcome message, webhook URL and the first 1000 characters of its system prompt. Use List Agents to find the ID. Fails with "Agent not found" for an unknown ID.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The ID of the agent.',
      required: true,
    }),
  },
  async run(context) {
    const agent = await bolnaClient.makeRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/agent/${encodeURIComponent(
        context.propsValue.agentId.trim()
      )}`,
    });
    const record = bolnaSchemas.isRecord(agent) ? agent : {};
    const prompt = findSystemPrompt(record['agent_prompts']);
    return {
      ...bolnaSchemas.pick({
        source: record,
        keys: [
          'id',
          'agent_name',
          'agent_type',
          'agent_status',
          'agent_welcome_message',
          'webhook_url',
        ],
      }),
      prompt_excerpt: prompt ? prompt.slice(0, PROMPT_EXCERPT_LENGTH) : null,
      created_at: record['created_at'] ?? null,
      updated_at: record['updated_at'] ?? null,
    };
  },
});

function findSystemPrompt(prompts: unknown): string | null {
  if (!bolnaSchemas.isRecord(prompts)) {
    return null;
  }
  for (const task of Object.values(prompts)) {
    if (
      bolnaSchemas.isRecord(task) &&
      typeof task['system_prompt'] === 'string'
    ) {
      return task['system_prompt'];
    }
  }
  return null;
}
