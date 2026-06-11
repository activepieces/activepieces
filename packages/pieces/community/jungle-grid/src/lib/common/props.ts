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

  const image = requiredString({
    propsValue,
    key: 'image',
    displayName: 'Image',
  });

  const constraints = removeEmptyValues({
    max_price_per_hour: optionalNumber({
      propsValue,
      key: 'max_price_per_hour',
      displayName: 'Max Price Per Hour',
      min: 0,
    }),
    preferred_gpu_family: optionalString(propsValue, 'preferred_gpu_family'),
    avoid_gpu_families: optionalStringArray(propsValue, 'avoid_gpu_families'),
    region_preference: optionalString(propsValue, 'region_preference'),
    latency_priority: optionalEnum({
      propsValue,
      key: 'latency_priority',
      allowedValues: priorityValues,
    }),
    cost_priority: optionalEnum({
      propsValue,
      key: 'cost_priority',
      allowedValues: priorityValues,
    }),
  });

  return removeEmptyValues({
    name: optionalString(propsValue, 'name'),
    image,
    workload_type: workloadType,
    model_size_gb: optionalNumber({
      propsValue,
      key: 'model_size_gb',
      displayName: 'Model Size (GB)',
      min: 0,
    }),
    command: optionalString(propsValue, 'command'),
    args: optionalStringArray(propsValue, 'args'),
    optimize_for: optionalEnum({
      propsValue,
      key: 'optimize_for',
      allowedValues: optimizeForValues,
    }),
    constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
    callback_url: includeSubmitOnlyFields ? optionalCallbackUrl(propsValue) : undefined,
    callback_metadata: includeSubmitOnlyFields
      ? optionalRecord(propsValue, 'callback_metadata')
      : undefined,
  });
}

function buildLogsQueryParams(propsValue: Record<string, unknown>): Record<string, string> {
  const tailLines = optionalNumber({
    propsValue,
    key: 'tail_lines',
    displayName: 'Tail Lines',
  });
  const queryParams = removeEmptyValues({
    tail: tailLines === undefined ? undefined : String(numberInRange({
      value: tailLines,
      key: 'tail_lines',
      min: 1,
      max: 500,
    })),
    cursor: optionalString(propsValue, 'cursor'),
    stream: optionalEnum({
      propsValue,
      key: 'stream',
      allowedValues: logStreamValues,
    }),
  });

  return stringifyRecord(queryParams);
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
  value: `### Async workflow

1. Run **Estimate Job** to preview route, queue, and cost signals.
2. Run **Submit Job** to queue work. This returns immediately with the Jungle Grid job status.
3. Add a Delay, branch, or loop, then call **Get Job Status**, **Get Job Runtime**, or **Get Job Logs**.
4. After completion, call **List Job Artifacts** and **Get Artifact Download URL** if the job produced files.`,
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

const priorityLabels: Record<string, string> = {
  low: 'Low',
  balanced: 'Balanced',
  high: 'High',
};

const workloadTypes = ['inference', 'batch', 'training'];
const optimizeForValues = ['balanced', 'cost', 'speed'];
const priorityValues = ['low', 'balanced', 'high'];
const logStreamValues = ['all', 'stdout', 'stderr'];
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
        { label: 'Batch', value: 'batch' },
        { label: 'Training', value: 'training' },
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
    description: 'Container command to run. Leave blank to use the image default entrypoint or command.',
    required: false,
  }),
  args: Property.Array({
    displayName: 'Arguments',
    description: 'Optional command arguments, one item per argument.',
    required: false,
  }),
  optimize_for: Property.StaticDropdown({
    displayName: 'Optimize For',
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
};

const routingConstraintProps = {
  max_price_per_hour: Property.Number({
    displayName: 'Max Price Per Hour',
    description: 'Optional maximum hourly price in USD.',
    required: false,
  }),
  preferred_gpu_family: Property.ShortText({
    displayName: 'Preferred GPU Family',
    description: 'Optional GPU family preference, for example `l4`.',
    required: false,
  }),
  avoid_gpu_families: Property.Array({
    displayName: 'Avoid GPU Families',
    description: 'Optional GPU families to avoid, one item per family, for example `a100`.',
    required: false,
  }),
  region_preference: Property.ShortText({
    displayName: 'Region Preference',
    description: 'Optional region preference, for example `us-east`.',
    required: false,
  }),
  latency_priority: Property.StaticDropdown({
    displayName: 'Latency Priority',
    description: 'Optional latency priority for routing.',
    required: false,
    options: {
      options: priorityValues.map((value) => ({
        label: priorityLabels[value],
        value,
      })),
    },
  }),
  cost_priority: Property.StaticDropdown({
    displayName: 'Cost Priority',
    description: 'Optional cost priority for routing.',
    required: false,
    options: {
      options: priorityValues.map((value) => ({
        label: priorityLabels[value],
        value,
      })),
    },
  }),
};

const submitOnlyProps = {
  callback_url: Property.ShortText({
    displayName: 'Callback URL',
    description: 'Optional HTTPS callback URL for terminal job lifecycle events.',
    required: false,
  }),
  callback_metadata: Property.Object({
    displayName: 'Callback Metadata',
    description: 'Optional key-value metadata Jungle Grid should include with callback events.',
    required: false,
  }),
};

const estimateJobProps = {
  ...baseJobPayloadProps,
  ...routingConstraintProps,
};

const submitJobProps = {
  ...baseJobPayloadProps,
  ...routingConstraintProps,
  ...submitOnlyProps,
};

export const jungleGridProps = {
  artifactId,
  asyncInstructions,
  buildEstimateJobPayload,
  buildListJobsQueryParams,
  buildLogsQueryParams,
  buildSubmitJobPayload,
  estimateJobProps,
  jobId,
  jobStatusValues,
  logStreamValues,
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
