import { Property } from '@activepieces/pieces-framework';
import z from 'zod';
import { PromptHubClient } from './client';

export const listProjectsProps = {
  teamId: Property.Number({ 
    displayName: 'Team ID', 
    description: 'The ID of the team. Can be found in your browser\'s URL bar when viewing Team Settings, or use current_team_id from /me endpoint.',
    required: true 
  }),
  group: Property.ShortText({ 
    displayName: 'Group Name', 
    description: 'Filter projects from a specific group. Must be URL-encoded if the group name contains spaces.',
    required: false 
  }),
  model: Property.Dropdown({
    displayName: 'Model',
    description: 'Filter projects where the head uses a specific model.',
    required: false,
    refreshers: ['auth', 'teamId', 'provider', 'group'],
    options: async ({ auth, propsValue }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect PromptHub to load models', options: [] };
      }
      const pv = (propsValue ?? {}) as Record<string, any>;
      const teamId = pv['teamId'];
      if (!teamId) {
        return { disabled: true, placeholder: 'Select a Team ID to load models', options: [] };
      }
      try {
        const client = new PromptHubClient(auth as string);
        const res = await client.listProjects(teamId, {
          group: pv['group'],
          provider: pv['provider'],
        });
        const data = res?.data ?? res;
        const set = new Map<string, string>();
        if (Array.isArray(data)) {
          for (const p of data) {
            const model = p?.head?.model;
            const provider = p?.head?.provider;
            if (model && typeof model === 'string') {
              const label = provider ? `${provider} · ${model}` : model;
              if (!set.has(model)) set.set(model, label);
            }
          }
        }
        const options = Array.from(set.entries()).map(([value, label]) => ({ label, value }));
        return {
          disabled: options.length === 0,
          placeholder: options.length ? undefined : 'No models found for this team/filter',
          options,
        };
      } catch {
        return { disabled: true, placeholder: 'Failed to load models', options: [] };
      }
    },
  }),
  provider: Property.Dropdown({
    displayName: 'Provider',
    description: 'Filter projects where the head uses a specific model provider.',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your PromptHub account to see providers',
          options: [],
        };
      }
      return {
        disabled: false,
        options: [
          { label: 'OpenAI', value: 'OpenAI' },
          { label: 'Anthropic', value: 'Anthropic' },
          { label: 'Azure', value: 'Azure' },
          { label: 'Google', value: 'Google' },
          { label: 'Amazon', value: 'Amazon' },
        ],
      };
    },
  }),
};

export const getProjectHeadProps = {
  projectId: Property.Number({ 
    displayName: 'Project ID', 
    description: 'The ID of the project. Can be found in your browser\'s URL bar when viewing that project.',
    required: true 
  }),
  branch: Property.ShortText({ 
    displayName: 'Branch', 
    description: 'Use the head of a specific branch. Defaults to your project\'s master/main branch. Must be URL-encoded if the branch name contains spaces or special characters.',
    required: false 
  }),
  fallback: Property.Checkbox({ 
    displayName: 'Use Fallback', 
    description: 'When enabled, any placeholders not provided in variables will fall back to your Project/Team defaults. Your variable overrides always take precedence.',
    required: false 
  }),
  variables: Property.Object({ 
    displayName: 'Variables', 
    description: 'Key-value pairs to override placeholders in the prompt. Both keys and values will be URL-encoded automatically.',
    required: false 
  }),
};

export const runPromptProps = {
  projectId: Property.Number({ 
    displayName: 'Project ID', 
    description: 'The ID of the project to run.',
    required: true 
  }),
  branch: Property.ShortText({ 
    displayName: 'Branch', 
    description: 'The branch name to run from (defaults to main/master).',
    required: false 
  }),
  hash: Property.ShortText({ 
    displayName: 'Hash', 
    description: 'Specific commit hash to run from.',
    required: false 
  }),
  variables: Property.Object({ 
    displayName: 'Variables', 
    description: 'Key-value pairs to pass as variables to the prompt.',
    required: false 
  }),
  messages: Property.Array({
    displayName: 'Messages',
    description: 'Chat messages for chat-based projects.',
    required: false,
    properties: {
      role: Property.StaticDropdown({
        displayName: 'Role',
        required: true,
        options: {
          options: [
            { label: 'system', value: 'system' },
            { label: 'user', value: 'user' },
            { label: 'assistant', value: 'assistant' },
          ],
        },
      }),
      content: Property.LongText({ displayName: 'Content', required: true }),
    },
  }),
  prompt: Property.LongText({ 
    displayName: 'Prompt', 
    description: 'Override prompt text for the project.',
    required: false 
  }),
  metadata: Property.Object({ 
    displayName: 'Metadata', 
    description: 'Additional metadata to include with the run.',
    required: false 
  }),
  timeoutSeconds: Property.Number({ 
    displayName: 'Timeout Seconds', 
    description: 'Request timeout in seconds (max 600).',
    required: false 
  }),
};

export const listProjectsSchema = {
  teamId: z.number().int().positive(),
  group: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
};

export const getProjectHeadSchema = {
  projectId: z.number().int().positive(),
  branch: z.string().optional(),
  variables: z.record(z.any()).optional(),
  fallback: z.boolean().optional(),
};

export const runPromptSchema = {
  projectId: z.number().int().positive(),
  branch: z.string().optional(),
  hash: z.string().optional(),
  variables: z.record(z.any()).optional(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })).optional(),
  prompt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timeoutSeconds: z.number().int().positive().max(600).optional(),
};

export function sanitizeVariables(vars: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
      out[k] = v;
    } else if (typeof v === 'object') {
      out[k] = JSON.stringify(v);
    } else {
      out[k] = String(v);
    }
  }
  return out;
}
