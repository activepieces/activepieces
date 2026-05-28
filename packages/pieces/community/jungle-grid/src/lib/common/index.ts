import {
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

async function apiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: JungleGridApiCallParams): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${normalizeBaseUrl(auth.props.api_base_url)}${path}`,
    headers: {
      Authorization: `Bearer ${auth.props.api_key}`,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
}

function buildJobPayload(propsValue: Record<string, unknown>): Record<string, unknown> {
  const constraints = removeEmptyValues({
    gpu_type: propsValue['gpu_type'],
    gpu_class: propsValue['gpu_class'],
    region_preference: propsValue['region_preference'],
    region_mode: propsValue['region_mode'],
    latency_priority: propsValue['latency_priority'],
    cost_priority: propsValue['cost_priority'],
  });

  return removeEmptyValues({
    name: propsValue['name'],
    workload_type: propsValue['workload_type'],
    image: propsValue['image'],
    command: propsValue['command'],
    args: propsValue['args'],
    environment: propsValue['environment'],
    model_size_gb: propsValue['model_size_gb'],
    disk_gb: propsValue['disk_gb'],
    optimize_for: propsValue['optimize_for'],
    constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
    huggingface_credential_id: propsValue['huggingface_credential_id'],
    webhook_url: propsValue['webhook_url'],
  });
}

function flattenRecord(value: Record<string, unknown>, prefix = ''): FlatRecord {
  return Object.entries(value).reduce<FlatRecord>((result, [key, entry]) => {
    const flatKey = prefix ? `${prefix}_${key}` : key;

    if (entry === null || entry === undefined) {
      return {
        ...result,
        [flatKey]: null,
      };
    }

    if (Array.isArray(entry)) {
      return {
        ...result,
        [flatKey]: entry
          .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
          .join(', '),
      };
    }

    if (isRecord(entry)) {
      return {
        ...result,
        ...flattenRecord(entry, flatKey),
      };
    }

    return {
      ...result,
      [flatKey]: toFlatValue(entry),
    };
  }, {});
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

function toFlatRecord(value: unknown): FlatRecord {
  if (isRecord(value)) {
    return flattenRecord(value);
  }

  return {
    value: value === undefined ? null : String(value),
  };
}

function toFlatRecords(value: unknown): FlatRecord[] {
  if (Array.isArray(value)) {
    return value.map(toFlatRecord);
  }

  if (isRecord(value) && 'artifacts' in value) {
    const artifacts = value['artifacts'];
    if (Array.isArray(artifacts)) {
      return artifacts.map(toFlatRecord);
    }
  }

  if (isRecord(value) && 'items' in value) {
    const items = value['items'];
    if (Array.isArray(items)) {
      return items.map(toFlatRecord);
    }
  }

  return [toFlatRecord(value)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFlatValue(value: unknown): string | number | boolean | null {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value === null || value === undefined) {
    return null;
  }

  return JSON.stringify(value);
}

const defaultBaseUrl = 'https://api.junglegrid.dev';

const endpoints = {
  estimateJob: '/v1/jobs/estimate',
  submitJob: '/v1/jobs',
  jobStatus: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}`,
  jobLogs: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}/logs`,
  artifacts: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}/artifacts`,
  artifactDownloadUrl: (jobId: string, artifactId: string) =>
    `/v1/jobs/${encodeURIComponent(jobId)}/artifacts/${encodeURIComponent(artifactId)}/download`,
};

const asyncInstructions = Property.MarkDown({
  value: `### Async workflow

1. Run **Estimate Job** to preview cost and resources.
2. Run **Submit Job** to enqueue work. This returns immediately with a \`job_id\`.
3. Add a Delay or branch, then call **Get Job Status** or **Get Job Logs**.
4. After completion, call **List Artifacts** and **Get Artifact Download URL**.`,
});

const jobId = Property.ShortText({
  displayName: 'Job ID',
  description: 'The `job_id` returned by Submit Job.',
  required: true,
});

const artifactId = Property.ShortText({
  displayName: 'Artifact ID',
  description: 'The artifact ID returned by List Artifacts.',
  required: true,
});

const jobPayloadProps = {
  name: Property.ShortText({
    displayName: 'Job Name',
    description: 'Optional human-readable name for this Jungle Grid job.',
    required: false,
  }),
  workload_type: Property.StaticDropdown({
    displayName: 'Workload Type',
    description: 'Choose the type of compute workload Jungle Grid should run.',
    required: true,
    defaultValue: 'inference',
    options: {
      options: [
        { label: 'Inference', value: 'inference' },
        { label: 'Training', value: 'training' },
        { label: 'Fine-tuning', value: 'fine-tuning' },
        { label: 'Batch', value: 'batch' },
      ],
    },
  }),
  image: Property.ShortText({
    displayName: 'Image or Container',
    description:
      'Container image or runtime identifier for the job, for example a public image name or a Jungle Grid runtime alias.',
    required: true,
  }),
  command: Property.LongText({
    displayName: 'Command',
    description: 'Command to execute in the container. Leave blank to use the image default entrypoint.',
    required: false,
  }),
  args: Property.Array({
    displayName: 'Arguments',
    description: 'Optional command arguments, one item per argument.',
    required: false,
  }),
  environment: Property.Object({
    displayName: 'Environment Variables',
    description: 'Key-value environment variables to pass to the job.',
    required: false,
  }),
  model_size_gb: Property.Number({
    displayName: 'Model Size (GB)',
    description: 'Approximate model size in GB. This helps Jungle Grid estimate memory and capacity fit.',
    required: false,
  }),
  disk_gb: Property.Number({
    displayName: 'Disk (GB)',
    description: 'Optional disk size requirement in GB.',
    required: false,
  }),
  optimize_for: Property.StaticDropdown({
    displayName: 'Optimize For',
    description: 'Routing preference for cost, speed, or balanced placement.',
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
  gpu_type: Property.ShortText({
    displayName: 'GPU Type',
    description:
      'Optional exact GPU type preference, such as A100 or H100. Leave blank to let Jungle Grid route automatically.',
    required: false,
  }),
  gpu_class: Property.StaticDropdown({
    displayName: 'GPU Class',
    description: 'Optional GPU class preference.',
    required: false,
    options: {
      options: [
        { label: 'Consumer', value: 'consumer' },
        { label: 'Datacenter', value: 'datacenter' },
      ],
    },
  }),
  region_preference: Property.ShortText({
    displayName: 'Region Preference',
    description: 'Optional preferred region, for example us-east.',
    required: false,
  }),
  region_mode: Property.StaticDropdown({
    displayName: 'Region Mode',
    description: 'Choose whether the region preference is soft or strict.',
    required: false,
    defaultValue: 'prefer',
    options: {
      options: [
        { label: 'Prefer', value: 'prefer' },
        { label: 'Strict', value: 'strict' },
      ],
    },
  }),
  latency_priority: Property.StaticDropdown({
    displayName: 'Latency Priority',
    description: 'Optional latency priority for routing.',
    required: false,
    options: {
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Balanced', value: 'balanced' },
        { label: 'High', value: 'high' },
      ],
    },
  }),
  cost_priority: Property.StaticDropdown({
    displayName: 'Cost Priority',
    description: 'Optional cost priority for routing.',
    required: false,
    options: {
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Balanced', value: 'balanced' },
        { label: 'High', value: 'high' },
      ],
    },
  }),
  huggingface_credential_id: Property.ShortText({
    displayName: 'Hugging Face Credential ID',
    description: 'Optional Jungle Grid credential ID for gated models, private datasets, or model downloads.',
    required: false,
  }),
  webhook_url: Property.ShortText({
    displayName: 'Webhook URL',
    description: 'Optional callback URL for Jungle Grid job events if your workflow has an external receiver.',
    required: false,
  }),
};

export const jungleGridCommon = {
  apiCall,
  asyncInstructions,
  artifactId,
  buildJobPayload,
  defaultBaseUrl,
  endpoints,
  jobId,
  jobPayloadProps,
  normalizeBaseUrl,
  toFlatRecord,
  toFlatRecords,
};

type JungleGridAuthValue = {
  props: {
    api_base_url: string;
    api_key: string;
  };
};

type JungleGridApiCallParams = {
  auth: JungleGridAuthValue;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
};

type FlatRecord = Record<string, string | number | boolean | null>;
