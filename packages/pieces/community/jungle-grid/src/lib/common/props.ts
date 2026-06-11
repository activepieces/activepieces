import { Property } from '@activepieces/pieces-framework';

function buildEstimateJobPayload(propsValue: Record<string, unknown>): Record<string, unknown> {
  return buildJobPayload({
    propsValue,
    includeSubmitOnlyFields: false,
  });
}

function buildSubmitJobPayload(propsValue: Record<string, unknown>): Record<string, unknown> {
  return buildJobPayload({
    propsValue,
    includeSubmitOnlyFields: true,
  });
}

function buildJobPayload({
  propsValue,
  includeSubmitOnlyFields,
}: BuildJobPayloadParams): Record<string, unknown> {
  const workloadType = requiredString({
    propsValue,
    key: 'workload_type',
    displayName: 'Workload Type',
  });
  assertOneOf({
    value: workloadType,
    key: 'workload_type',
    allowedValues: workloadTypes,
  });

  const image = includeSubmitOnlyFields
    ? requiredString({
      propsValue,
      key: 'image',
      displayName: 'Image',
    })
    : optionalString(propsValue, 'image');

  const command = optionalCommand(propsValue);
  const routingMode = optionalEnum({
    propsValue,
    key: 'routing_mode',
    allowedValues: routingModeValues,
  }) ?? optionalEnum({
    propsValue,
    key: 'optimize_for',
    allowedValues: routingModeValues,
  });

  return removeEmptyValues({
    name: includeSubmitOnlyFields
      ? requiredString({
        propsValue,
        key: 'name',
        displayName: 'Job Name',
      })
      : optionalString(propsValue, 'name'),
    image,
    workload_type: toApiWorkloadType(workloadType),
    model_size_gb: optionalNumber({
      propsValue,
      key: 'model_size_gb',
      displayName: 'Model Size (GB)',
      min: 0,
    }),
    command,
    args: optionalStringArray(propsValue, 'args'),
    environment: includeSubmitOnlyFields ? optionalStringRecord(propsValue, 'env') : undefined,
    input_files: includeSubmitOnlyFields ? optionalInputReferences(propsValue, 'input_files') : undefined,
    script_files: includeSubmitOnlyFields ? optionalInputReferences(propsValue, 'script_files') : undefined,
    expected_artifacts: includeSubmitOnlyFields ? optionalStringArray(propsValue, 'expected_artifacts') : undefined,
    optimize_for: routingMode,
    template: optionalString(propsValue, 'template'),
    notes: includeSubmitOnlyFields ? undefined : optionalString(propsValue, 'notes'),
    metadata: includeSubmitOnlyFields ? optionalRecord(propsValue, 'metadata') : undefined,
    webhook_url: includeSubmitOnlyFields ? optionalCallbackUrl(propsValue) : undefined,
  });
}

function buildLogsQueryParams(propsValue: Record<string, unknown>): Record<string, string> {
  const limit = optionalNumber({
    propsValue,
    key: 'limit',
    displayName: 'Limit',
  }) ?? optionalNumber({
    propsValue,
    key: 'tail_lines',
    displayName: 'Tail Lines',
  });
  const queryParams = removeEmptyValues({
    limit: limit === undefined ? undefined : String(numberInRange({
      value: limit,
      key: 'limit',
      min: 1,
      max: 1000,
    })),
    cursor: optionalString(propsValue, 'cursor'),
  });

  return stringifyRecord(queryParams);
}

function buildListJobInputsQueryParams(propsValue: Record<string, unknown>): Record<string, string> {
  return stringifyRecord(removeEmptyValues({
    limit: optionalLimit(propsValue, 100),
    cursor: optionalString(propsValue, 'cursor'),
    status: optionalString(propsValue, 'status'),
    kind: optionalEnum({
      propsValue,
      key: 'kind',
      allowedValues: jobInputKinds,
    }),
  }));
}

function buildEventsQueryParams(propsValue: Record<string, unknown>): Record<string, string> {
  return stringifyRecord(removeEmptyValues({
    limit: optionalLimit(propsValue, 1000),
    cursor: optionalString(propsValue, 'cursor'),
    type: optionalString(propsValue, 'type'),
    since: optionalString(propsValue, 'since'),
  }));
}

function buildListJobsQueryParams(propsValue: Record<string, unknown>): Record<string, string> {
  const limit = optionalNumber({
    propsValue,
    key: 'limit',
    displayName: 'Limit',
  });
  const queryParams = removeEmptyValues({
    limit: limit === undefined ? undefined : String(numberInRange({
      value: limit,
      key: 'limit',
      min: 1,
      max: 100,
    })),
    cursor: optionalString(propsValue, 'cursor'),
    status: optionalEnum({
      propsValue,
      key: 'status',
      allowedValues: jobStatusValues,
    }),
  });

  return stringifyRecord(queryParams);
}

function optionalString(propsValue: Record<string, unknown>, key: string): string | undefined {
  const value = propsValue[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string.`);
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function requiredString({
  propsValue,
  key,
  displayName,
}: RequiredStringParams): string {
  const value = optionalString(propsValue, key);
  if (!value) {
    throw new Error(`${displayName} is required.`);
  }

  return value;
}

function optionalNumber({
  propsValue,
  key,
  displayName,
  min,
}: OptionalNumberParams): number | undefined {
  const value = propsValue[key];
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${displayName} must be a finite number.`);
  }

  if (min !== undefined && value <= min) {
    throw new Error(`${displayName} must be greater than ${min}.`);
  }

  return value;
}

function optionalStringArray(propsValue: Record<string, unknown>, key: string): string[] | undefined {
  const value = propsValue[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array of strings.`);
  }

  const items = value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`${key}[${index}] must be a string.`);
    }
    return item;
  }).filter((item) => item.length > 0);

  return items.length > 0 ? items : undefined;
}

function optionalCommand(propsValue: Record<string, unknown>): string[] | string | undefined {
  const value = propsValue['command'];
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return optionalStringArray(propsValue, 'command');
  }
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }

  throw new Error('command must be a string or an array of strings.');
}

function optionalStringRecord(propsValue: Record<string, unknown>, key: string): Record<string, string> | undefined {
  const record = optionalRecord(propsValue, key);
  if (record === undefined) {
    return undefined;
  }

  return Object.entries(record).reduce<Record<string, string>>((result, [recordKey, recordValue]) => {
    if (typeof recordValue !== 'string') {
      throw new Error(`${key}.${recordKey} must be a string.`);
    }

    return {
      ...result,
      [recordKey]: recordValue,
    };
  }, {});
}

function optionalInputReferences(propsValue: Record<string, unknown>, key: string): InputReference[] | undefined {
  const value = propsValue[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array of input IDs or { input_id } objects.`);
  }

  const references = value.map((item, index) => inputReference({
    item,
    key,
    index,
  }));

  return references.length > 0 ? references : undefined;
}

function inputReference({
  item,
  key,
  index,
}: InputReferenceParams): InputReference {
  if (typeof item === 'string') {
    const inputId = item.trim();
    if (!inputId) {
      throw new Error(`${key}[${index}] must include input_id.`);
    }
    return { input_id: inputId };
  }
  if (!isRecord(item)) {
    throw new Error(`${key}[${index}] must be an input ID or an object with input_id.`);
  }

  const inputId = optionalString(item, 'input_id');
  if (!inputId) {
    throw new Error(`${key}[${index}] must include input_id.`);
  }

  return { input_id: inputId };
}

function optionalRecord(propsValue: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = propsValue[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error(`${key} must be an object.`);
  }

  return value;
}

function optionalLimit(propsValue: Record<string, unknown>, max: number): string | undefined {
  const limit = optionalNumber({
    propsValue,
    key: 'limit',
    displayName: 'Limit',
  });
  if (limit === undefined) {
    return undefined;
  }

  return String(numberInRange({
    value: limit,
    key: 'limit',
    min: 1,
    max,
  }));
}

function optionalEnum({
  propsValue,
  key,
  allowedValues,
}: OptionalEnumParams): string | undefined {
  const value = optionalString(propsValue, key);
  if (value === undefined) {
    return undefined;
  }

  assertOneOf({
    value,
    key,
    allowedValues,
  });
  return value;
}

function optionalCallbackUrl(propsValue: Record<string, unknown>): string | undefined {
  const value = optionalString(propsValue, 'callback_url');
  if (value === undefined) {
    return undefined;
  }

  const url = parseUrl(value);
  if (url.protocol === 'https:' || isLocalhost(url.hostname)) {
    return value;
  }

  throw new Error('Callback URL must use HTTPS unless it targets localhost.');
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error('Callback URL must be a valid URL.');
  }
}

function isLocalhost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname);
}

function toApiWorkloadType(workloadType: string): string {
  return workloadType === 'fine_tuning' ? 'fine-tuning' : workloadType;
}

function assertOneOf({
  value,
  key,
  allowedValues,
}: AssertOneOfParams): void {
  if (!allowedValues.includes(value)) {
    throw new Error(`${key} must be one of: ${allowedValues.join(', ')}.`);
  }
}

function numberInRange({
  value,
  key,
  min,
  max,
}: NumberInRangeParams): number {
  if (value < min || value > max) {
    throw new Error(`${key} must be between ${min} and ${max}.`);
  }

  return Math.floor(value);
}

function removeEmptyValues(value: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(value).reduce<Record<string, unknown>>((result, [key, entry]) => {
    if (entry === undefined || entry === null || entry === '') {
      return result;
    }

    return {
      ...result,
      [key]: entry,
    };
  }, {});
}

function stringifyRecord(value: Record<string, unknown>): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((result, [key, entry]) => ({
    ...result,
    [key]: String(entry),
  }), {});
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const asyncInstructions = Property.MarkDown({
  value: `### Recommended Jungle Grid workflow

1. Run **Upload Job Input** for datasets, input files, or scripts.
2. Run **Submit Job** and pass uploaded IDs into \`input_files\` or \`script_files\`.
3. Monitor lifecycle with **Get Job Events** or current state with **Get Job Status**.
4. Use **Get Job Logs** for workload stdout/stderr once runtime logs exist.
5. After completion, call **List Job Artifacts** and **Get Artifact Download URL**.`,
});

const jobId = Property.ShortText({
  displayName: 'Job ID',
  description: 'The `job_id` returned by Submit Job or List Jobs.',
  required: true,
});

const artifactId = Property.ShortText({
  displayName: 'Artifact ID',
  description: 'The artifact ID returned by List Job Artifacts.',
  required: true,
});

const workloadTypes = ['inference', 'training', 'fine_tuning', 'batch'];
const routingModeValues = ['cost', 'speed', 'balanced'];
const jobInputKinds = ['input', 'script'];
const jobStatusValues = [
  'pending',
  'queued',
  'assigned',
  'provisioning',
  'starting',
  'running',
  'completed',
  'failed',
  'rejected',
  'cancelled',
];

const baseJobPayloadProps = {
  name: Property.ShortText({
    displayName: 'Job Name',
    description: 'Optional human-readable label for this Jungle Grid job.',
    required: false,
  }),
  workload_type: Property.StaticDropdown({
    displayName: 'Workload Type',
    description: 'The workload class Jungle Grid should route.',
    required: true,
    defaultValue: 'inference',
    options: {
      options: [
        { label: 'Inference', value: 'inference' },
        { label: 'Training', value: 'training' },
        { label: 'Fine Tuning', value: 'fine_tuning' },
        { label: 'Batch', value: 'batch' },
      ],
    },
  }),
  image: Property.ShortText({
    displayName: 'Container Image',
    description: 'Public container image reference, for example `python:3.11` or `pytorch/pytorch:2.4.0-cuda12.1-cudnn9-runtime`.',
    required: true,
  }),
  model_size_gb: Property.Number({
    displayName: 'Model Size (GB)',
    description: 'Approximate model size in GB. Jungle Grid uses this for routing and cost estimation.',
    required: false,
  }),
  command: Property.LongText({
    displayName: 'Command',
    description: 'Container command to run. Existing flows can pass a string; mapped values may also pass an array of command tokens.',
    required: false,
  }),
  args: Property.Array({
    displayName: 'Arguments',
    description: 'Optional command arguments, one item per argument.',
    required: false,
  }),
  routing_mode: Property.StaticDropdown({
    displayName: 'Routing Mode',
    description: 'Placement preference for cost, speed, or balanced routing.',
    required: false,
    defaultValue: 'balanced',
    options: {
      options: [
        { label: 'Balanced', value: 'balanced' },
        { label: 'Cost', value: 'cost' },
        { label: 'Speed', value: 'speed' },
      ],
    },
  }),
  template: Property.ShortText({
    displayName: 'Template',
    description: 'Optional Jungle Grid template name or ID.',
    required: false,
  }),
};

const estimateOnlyProps = {
  notes: Property.LongText({
    displayName: 'Notes',
    description: 'Optional notes that help Jungle Grid classify and route the workload.',
    required: false,
  }),
};

const submitOnlyProps = {
  name: Property.ShortText({
    displayName: 'Job Name',
    description: 'Human-readable label for this Jungle Grid job.',
    required: true,
  }),
  env: Property.Object({
    displayName: 'Environment Variables',
    description: 'Optional environment variables. Values must be strings.',
    required: false,
  }),
  input_files: Property.Array({
    displayName: 'Input Files',
    description: 'Uploaded input IDs from Upload Job Input. Each item may be an input ID string or an object with `input_id`.',
    required: false,
  }),
  script_files: Property.Array({
    displayName: 'Script Files',
    description: 'Uploaded script IDs from Upload Job Input. Jungle Grid mounts them under `/workspace/scripts/<filename>`.',
    required: false,
  }),
  expected_artifacts: Property.Array({
    displayName: 'Expected Artifacts',
    description: 'Expected output files under `/workspace/artifacts`, one path per item.',
    required: false,
  }),
  metadata: Property.Object({
    displayName: 'Metadata',
    description: 'Optional JSON metadata stored with the submitted job.',
    required: false,
  }),
  callback_url: Property.ShortText({
    displayName: 'Callback URL',
    description: 'Optional HTTPS webhook URL. It is sent as `webhook_url` for API compatibility when provided.',
    required: false,
  }),
};

const estimateJobProps = {
  ...baseJobPayloadProps,
  ...estimateOnlyProps,
};

const submitJobProps = {
  ...baseJobPayloadProps,
  ...submitOnlyProps,
};

export const jungleGridProps = {
  artifactId,
  asyncInstructions,
  buildEstimateJobPayload,
  buildEventsQueryParams,
  buildListJobInputsQueryParams,
  buildListJobsQueryParams,
  buildLogsQueryParams,
  buildSubmitJobPayload,
  estimateJobProps,
  jobInputKinds,
  jobId,
  jobStatusValues,
  submitJobProps,
};

type BuildJobPayloadParams = {
  propsValue: Record<string, unknown>;
  includeSubmitOnlyFields: boolean;
};

type RequiredStringParams = {
  propsValue: Record<string, unknown>;
  key: string;
  displayName: string;
};

type OptionalNumberParams = RequiredStringParams & {
  min?: number;
};

type OptionalEnumParams = {
  propsValue: Record<string, unknown>;
  key: string;
  allowedValues: string[];
};

type AssertOneOfParams = {
  value: string;
  key: string;
  allowedValues: string[];
};

type NumberInRangeParams = {
  value: number;
  key: string;
  min: number;
  max: number;
};

type InputReference = {
  input_id: string;
};

type InputReferenceParams = {
  item: unknown;
  key: string;
  index: number;
};
