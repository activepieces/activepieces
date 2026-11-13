import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaAuth } from '../../auth';
import { exaApi, exaInput } from '../../common/client';
import { AgentRun, agentEfforts, agentRuns } from '../../common/agent';
import { agentRunOutputSchema } from '../../output-schemas';

export const createAgentRunAction = createAction({
  name: 'exa_create_agent_run',
  classification: 'WRITE',
  displayName: 'Start Agent Run',
  description:
    'Starts an Exa Agent run for deep research, list building or structured extraction. The run works in the background; use Get Agent Run to read the result.',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts an asynchronous Exa Agent run that researches a natural-language task on the web and can return JSON shaped by an optional output schema. Use for multi-step research or list building that a single search cannot answer; it returns right away with the run id and a queued or running status, so poll exa_get_agent_run until status is completed, failed or cancelled. Effort sets the price (minimal $0.012 to xhigh $1.00; auto and ultra are metered up to $5/$20), defaulting to low. Not idempotent: each call starts and bills a new run.',
    idempotent: false,
  },
  auth: exaAuth,
  outputSchema: agentRunOutputSchema,
  props: {
    query: Property.LongText({
      displayName: 'Task',
      description:
        'What the agent should research or build, in plain language. Example: "List 10 Series A climate-tech startups in Europe founded after 2022, with their website and lead investor."',
      required: true,
    }),
    effort: Property.StaticDropdown({
      displayName: 'Effort',
      description:
        'How hard the agent works, which sets the price per run. Minimal to Extra High are fixed prices. Auto and Ultra are metered by usage and can cost up to $5 and $20 per run unless you set Max Cost. Defaults to Low.',
      required: false,
      defaultValue: agentEfforts.DEFAULT,
      options: { options: agentEfforts.OPTIONS },
    }),
    systemPrompt: Property.LongText({
      displayName: 'Instructions',
      description:
        'Extra guidance for the agent, such as preferred sources or rules like "only use official company websites".',
      required: false,
    }),
    outputSchema: Property.Json({
      displayName: 'Output Schema',
      description:
        'Optional JSON Schema for a structured result, returned in Structured Output. Example: {"type":"object","properties":{"companies":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"website":{"type":"string"}}}}}}',
      required: false,
    }),
    maxCostDollars: Property.Number({
      displayName: 'Max Cost (USD)',
      description:
        'Spending cap for one run, between 1 and 100. Only applies when Effort is Auto or Ultra; fixed efforts already have a fixed price.',
      required: false,
    }),
    previousRunId: Property.ShortText({
      displayName: 'Previous Run ID',
      description:
        'Continue from an earlier run so the agent builds on its findings. Use the ID returned by Start Agent Run, e.g. "agent_run_01k4d9w6y3h7p2m8".',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Optional key-value labels stored with the run, e.g. {"flow": "lead-research"}.',
      required: false,
    }),
  },
  async run(context) {
    const { query, systemPrompt, previousRunId, metadata } = context.propsValue;
    const effort = effortOf(context.propsValue.effort);
    const maxCostDollars = exaInput.optionalNumber({
      value: context.propsValue.maxCostDollars,
      name: 'Max Cost (USD)',
      min: 1,
      max: 100,
    });
    if (maxCostDollars !== undefined && !agentEfforts.METERED.includes(effort)) {
      throw new Error('Max Cost only applies when Effort is Auto or Ultra. Clear it or change the effort.');
    }
    const outputSchema = schemaOf(context.propsValue.outputSchema);
    const metadataValues = metadataOf(metadata);
    const instructions = exaInput.optionalText(systemPrompt);
    const previous = exaInput.optionalText(previousRunId);

    const body = {
      query,
      effort,
      ...(instructions ? { systemPrompt: instructions } : {}),
      ...(outputSchema ? { outputSchema } : {}),
      ...(maxCostDollars !== undefined ? { budget: { maxCostDollars } } : {}),
      ...(previous ? { previousRunId: previous } : {}),
      ...(metadataValues ? { metadata: metadataValues } : {}),
    };

    const run = await exaApi.call<AgentRun>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/agent/runs',
      body,
    });
    return agentRuns.flattenRun(run);
  },
});

function effortOf(value: unknown): string {
  const effort = exaInput.optionalText(value) ?? agentEfforts.DEFAULT;
  if (!agentEfforts.ALL.includes(effort)) {
    throw new Error(`Effort must be one of: ${agentEfforts.ALL.join(', ')}.`);
  }
  return effort;
}

function schemaOf(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed: unknown = typeof value === 'string' ? parseJson(value) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Output Schema must be a JSON Schema object, e.g. {"type":"object","properties":{...}}.');
  }
  return Object.fromEntries(Object.entries(parsed));
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Output Schema is not valid JSON.');
  }
}

function metadataOf(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const entries = Object.entries(value)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]);
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}
