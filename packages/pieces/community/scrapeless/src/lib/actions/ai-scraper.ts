import { createAction, Property } from '@activepieces/pieces-framework';
import { scrapelessApiAuth } from '../auth';
import { aiScraper } from '../common/ai-scraper';
import { aiScraperOutput } from '../common/ai-scraper-output';
import { aiScraperProps } from '../common/ai-scraper-props';
import { aiScraperWait } from '../common/ai-scraper-wait';
import { aiScraperTaskOutputSchema } from '../output-schemas';

function recordInput(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText({
  input,
  key,
  label,
  fallback,
}: {
  input: Record<string, unknown>;
  key: string;
  label: string;
  fallback?: string;
}): string {
  const value = input[key] ?? fallback;
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function optionalText({
  input,
  key,
}: {
  input: Record<string, unknown>;
  key: string;
}): string | undefined {
  const value = input[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string.`);
  }
  return value;
}

function optionalBoolean({
  input,
  key,
}: {
  input: Record<string, unknown>;
  key: string;
}): boolean | undefined {
  const value = input[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') {
    throw new Error(`${key} must be true or false.`);
  }
  return value;
}

async function execute({
  apiKey,
  operation,
  website,
  parameters,
}: {
  apiKey: string;
  operation: unknown;
  website: unknown;
  parameters: unknown;
}) {
  const input = recordInput(parameters);
  if (operation === 'get_task_result') {
    return aiScraper.getTaskResult({
      apiKey,
      taskId: requiredText({ input, key: 'task_id', label: 'Task ID' }),
    });
  }
  if (operation !== 'create_task') {
    throw new Error('Select Create Task and Wait, Create Task, or Get Task Result.');
  }
  return aiScraper.createTask(creationInput({ apiKey, website, parameters }));
}

function creationInput({ apiKey, website, parameters }: {
  apiKey: string;
  website: unknown;
  parameters: unknown;
}): Parameters<typeof aiScraper.createTask>[0] {
  const input = recordInput(parameters);
  const engine = requiredText({
    input: recordInput(website),
    key: 'engine',
    label: 'Website',
  });
  return {
    apiKey,
    engine,
    prompt: requiredText({ input, key: 'prompt', label: 'Prompt' }),
    country: requiredText({
      input,
      key: 'country',
      label: 'Country',
      fallback: 'US',
    }),
    webSearch:
      engine === 'chatgpt' || engine === 'perplexity'
        ? optionalBoolean({ input, key: 'web_search' })
        : undefined,
    shopping: ['chatgpt', 'gemini', 'aimode', 'overview'].includes(engine)
      ? optionalBoolean({ input, key: 'shopping' })
      : undefined,
    mode:
      engine === 'copilot' || engine === 'grok'
        ? optionalText({ input, key: 'mode' })
        : undefined,
    location:
      engine === 'aimode' || engine === 'overview'
        ? optionalText({ input, key: 'location' })
        : undefined,
    uule:
      engine === 'aimode' || engine === 'overview'
        ? optionalText({ input, key: 'uule' })
        : undefined,
    shareLink: ['chatgpt', 'perplexity', 'copilot', 'aimode', 'overview', 'grok'].includes(engine)
      ? optionalBoolean({ input, key: 'should_fetch_share_link' })
      : undefined,
  };
}

export const aiScraperAction = createAction({
  auth: scrapelessApiAuth,
  name: 'ai_scraper',
  classification: 'WRITE',
  displayName: 'AI Scraper',
  description:
    'Create a task and wait for its result with finite limits, create a task only, or query an existing task once.',
  audience: 'both',
  aiMetadata: {
    description:
      'Use create_and_wait to submit to one of eight AI websites and poll the same ID within the configured time/query limits. Use create_task for asynchronous submission only or get_task_result for one recovery query. Creation is billable and non-idempotent; do not repeat after an uncertain timeout. Waiting occupies an execution slot and does not cancel the provider task or an in-flight request.',
    idempotent: false,
  },
  outputSchema: aiScraperTaskOutputSchema,
  errorHandlingOptions: aiScraperProps.creationErrorHandling,
  props: {
    operation: Property.StaticDropdown({
      displayName: 'Operation',
      required: true,
      defaultValue: 'create_and_wait',
      options: {
        options: [
          { label: 'Create Task and Wait', value: 'create_and_wait' },
          { label: 'Create Task', value: 'create_task' },
          { label: 'Get Task Result', value: 'get_task_result' },
        ],
      },
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Table-Friendly Fields returns only text, numbers, booleans, or null. Source lists and the complete native result are preserved as JSON text. Original Structured Fields keeps objects and arrays.',
      required: false,
      defaultValue: 'table',
      options: {
        options: [
          { label: 'Table-Friendly Fields', value: 'table' },
          { label: 'Original Structured Fields', value: 'raw' },
        ],
      },
    }),
    website: Property.DynamicProperties({
      auth: undefined,
      displayName: 'Website',
      required: false,
      refreshers: ['operation'],
      props: aiScraperProps.websiteProperties,
    }),
    wait_settings: Property.DynamicProperties({
      auth: undefined,
      displayName: 'Wait Settings',
      required: false,
      refreshers: ['operation'],
      props: aiScraperProps.waitProperties,
    }),
    parameters: Property.DynamicProperties({
      auth: undefined,
      displayName: 'Parameters',
      required: true,
      refreshers: ['operation', 'website'],
      props: aiScraperProps.requestProperties,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    aiScraperOutput.validate(propsValue.output_format);
    if (propsValue.operation === 'create_and_wait') {
      const limits = aiScraperWait.settings(propsValue.wait_settings);
      const input = creationInput({ apiKey: auth.secret_text, website: propsValue.website, parameters: propsValue.parameters });
      aiScraper.validateTask(input);
      const result = await aiScraperWait.run({
        settings: limits,
        create: () => aiScraper.createTask(input),
        query: taskId => aiScraper.getTaskResult({ apiKey: auth.secret_text, taskId }),
        report: data => context.output.update({ data }),
        sanitize: value => auth.secret_text ? value.split(auth.secret_text).join('[redacted]') : value,
      });
      return aiScraperOutput.format({ result: { ...result.task, poll_attempts: result.poll_attempts, elapsed_seconds: result.elapsed_seconds }, format: propsValue.output_format });
    }
    const started = performance.now();
    const result = await execute({ apiKey: auth.secret_text, ...propsValue });
    return aiScraperOutput.format({ result: { ...result, poll_attempts: propsValue.operation === 'get_task_result' ? 1 : 0, elapsed_seconds: Math.round((performance.now() - started) / 1000 * 1000) / 1000 }, format: propsValue.output_format });
  },
});
