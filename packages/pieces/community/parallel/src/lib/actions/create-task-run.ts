import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parallelAuth } from '../auth';
import { parallelClient, TASK_PROCESSORS } from '../common/client';

export const createTaskRunAction = createAction({
  auth: parallelAuth,
  name: 'create_task_run',
  displayName: 'Create Task Run',
  description:
    'Initiate a Parallel research task. Returns immediately with a queued run; use Get Task Run Result to wait for completion.',
  props: {
    input: Property.LongText({
      displayName: 'Input',
      description:
        'Input to the task (free text or a JSON string). Example: "What was the GDP of France in 2023?"',
      required: true,
    }),
    processor: Property.StaticDropdown({
      displayName: 'Processor',
      description: 'Speed/depth tier for the task.',
      required: true,
      defaultValue: 'base',
      options: { options: TASK_PROCESSORS },
    }),
    output_schema_type: Property.StaticDropdown({
      displayName: 'Output Schema Type',
      description: 'How the task should structure its output.',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Text', value: 'text' },
          { label: 'JSON Schema', value: 'json' },
        ],
      },
    }),
    output_text_description: Property.LongText({
      displayName: 'Output Description (Text)',
      description:
        'Used when Output Schema Type is "Text". Plain-language description of the desired output.',
      required: false,
    }),
    output_json_schema: Property.Json({
      displayName: 'Output JSON Schema',
      description:
        'Used when Output Schema Type is "JSON Schema". A JSON Schema object describing the desired structured output.',
      required: false,
    }),
    include_domains: Property.Array({
      displayName: 'Include Domains',
      description: 'Optional source policy: only return results from these domains.',
      required: false,
    }),
    exclude_domains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Optional source policy: exclude results from these domains.',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description:
        'Optional key/value metadata stored with the run (keys ≤16 chars, values ≤512 chars).',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const includeDomains = ((props.include_domains ?? []) as unknown[]).filter(
      (d): d is string => typeof d === 'string' && d.trim().length > 0,
    );
    const excludeDomains = ((props.exclude_domains ?? []) as unknown[]).filter(
      (d): d is string => typeof d === 'string' && d.trim().length > 0,
    );

    const sourcePolicy =
      includeDomains.length || excludeDomains.length
        ? {
            ...(includeDomains.length ? { include_domains: includeDomains } : {}),
            ...(excludeDomains.length ? { exclude_domains: excludeDomains } : {}),
          }
        : undefined;

    const taskSpec = buildTaskSpec({
      type: props.output_schema_type,
      textDescription: props.output_text_description,
      jsonSchema: props.output_json_schema,
    });

    const body: Record<string, unknown> = {
      input: props.input,
      processor: props.processor,
    };
    if (taskSpec) body['task_spec'] = taskSpec;
    if (sourcePolicy) body['source_policy'] = sourcePolicy;
    if (props.metadata && Object.keys(props.metadata).length > 0) {
      body['metadata'] = props.metadata;
    }

    return await parallelClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/tasks/runs',
      body,
    });
  },
});

function buildTaskSpec({
  type,
  textDescription,
  jsonSchema,
}: {
  type: string | undefined;
  textDescription: string | undefined;
  jsonSchema: unknown;
}): Record<string, unknown> | undefined {
  if (!type || type === 'auto') {
    return undefined;
  }
  if (type === 'text') {
    if (!textDescription) return undefined;
    return {
      output_schema: { type: 'text', description: textDescription },
    };
  }
  if (type === 'json') {
    if (!jsonSchema || typeof jsonSchema !== 'object') return undefined;
    return {
      output_schema: { type: 'json', json_schema: jsonSchema },
    };
  }
  return undefined;
}
