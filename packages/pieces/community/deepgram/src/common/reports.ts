import { deepgramClient } from './client';

function endpointOf(path: unknown): string | null {
  if (typeof path !== 'string') {
    return null;
  }
  const match = /^\/v\d+\/([a-z-]+)/i.exec(path);
  return match ? match[1] : null;
}

function joinList(value: unknown): string {
  return Array.isArray(value)
    ? value
        .filter((item) => item !== null && item !== undefined)
        .map(String)
        .join(', ')
    : '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function flattenRequest(row: RequestRow): FlatRequest {
  const response = row.response ?? {};
  const details = response.details ?? {};
  return {
    request_id: row.request_id ?? '',
    created: stringOrNull(row.created),
    completed: stringOrNull(response.completed),
    endpoint: endpointOf(row.path),
    path: deepgramClient.maskOptional(row.path),
    api_key_id: stringOrNull(row.api_key_id),
    status_code: numberOrNull(response.code ?? row.code),
    method: stringOrNull(details.method),
    deployment: stringOrNull(response.deployment ?? row.deployment),
    duration_seconds: numberOrNull(details.duration),
    total_audio_seconds: numberOrNull(details.total_audio),
    channels: numberOrNull(details.channels),
    usd: numberOrNull(details.usd),
    models: joinList(details.models),
    features: joinList(details.features),
    tags: joinList(details.tags),
    tier: stringOrNull(details.tier),
    callback_status_code: numberOrNull(callbackOf(row.callback).code),
    callback_attempts: numberOrNull(callbackOf(row.callback).attempts),
  };
}

function callbackOf(callback: RequestRow['callback']): {
  code?: number;
  attempts?: number;
} {
  return callback !== null && typeof callback === 'object' ? callback : {};
}

function roundToMillionths(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function flattenUsage(body: UsageBreakdownResponse): FlatUsage {
  const results = (body.results ?? []).map((row) => {
    const grouping = row.grouping ?? {};
    return {
      start: stringOrNull(grouping.start),
      end: stringOrNull(grouping.end),
      hours: numberOrNull(row.hours) ?? 0,
      total_hours: numberOrNull(row.total_hours) ?? 0,
      agent_hours: numberOrNull(row.agent_hours) ?? 0,
      requests: numberOrNull(row.requests) ?? 0,
      tts_characters: numberOrNull(row.tts_characters) ?? 0,
      tokens_in: numberOrNull(row.tokens_in) ?? 0,
      tokens_out: numberOrNull(row.tokens_out) ?? 0,
      endpoint: stringOrNull(grouping.endpoint),
      method: stringOrNull(grouping.method),
      models: joinList(grouping.models),
      tags: joinList(grouping.tags),
      accessor: stringOrNull(grouping.accessor),
      feature_set: stringOrNull(grouping.feature_set),
      deployment: stringOrNull(grouping.deployment),
    };
  });
  const sum = (pick: (row: (typeof results)[number]) => number) =>
    results.reduce((total, row) => total + pick(row), 0);
  return {
    start: stringOrNull(body.start),
    end: stringOrNull(body.end),
    resolution: body.resolution
      ? `${body.resolution.amount ?? 1} ${body.resolution.units ?? ''}`.trim()
      : null,
    total_hours: roundToMillionths(sum((row) => row.total_hours)),
    total_requests: sum((row) => row.requests),
    total_tts_characters: sum((row) => row.tts_characters),
    total_tokens_in: sum((row) => row.tokens_in),
    total_tokens_out: sum((row) => row.tokens_out),
    results,
  };
}

function flattenBilling(body: BillingBreakdownResponse): FlatBilling {
  const results = (body.results ?? []).map((row) => {
    const grouping = row.grouping ?? {};
    return {
      dollars: numberOrNull(row.dollars) ?? 0,
      start: stringOrNull(grouping.start),
      end: stringOrNull(grouping.end),
      line_item: stringOrNull(grouping.line_item),
      accessor: stringOrNull(grouping.accessor),
      deployment: stringOrNull(grouping.deployment),
      tags: joinList(grouping.tags),
    };
  });
  return {
    start: stringOrNull(body.start),
    end: stringOrNull(body.end),
    total_dollars: roundToMillionths(
      results.reduce((total, row) => total + row.dollars, 0)
    ),
    results,
  };
}

function toDay(value: string | undefined): string | undefined {
  if (value === undefined || value === null || value.trim().length === 0) {
    return undefined;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`"${trimmed}" is not a valid date. Use YYYY-MM-DD.`);
  }
  return parsed.toISOString().slice(0, 10);
}

function toInstant(value: string | undefined): string | undefined {
  if (value === undefined || value === null || value.trim().length === 0) {
    return undefined;
  }
  const trimmed = value.trim();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`"${trimmed}" is not a valid date or time.`);
  }
  return parsed.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function checkRange({
  start,
  end,
}: {
  start: string | undefined;
  end: string | undefined;
}): void {
  if (start && end && start > end) {
    throw new Error('The start date must be on or before the end date.');
  }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === 'string' && item.length > 0
      )
    : [];
}

function stripTagPrefix(tag: string): string {
  return tag.startsWith('tag=') ? tag.slice(4) : tag;
}

function flattenUsageFields(body: UsageFieldsResponse): FlatUsageFields {
  return {
    accessors: stringList(body.accessors),
    tags: [...new Set(stringList(body.tags).map(stripTagPrefix))],
    models: (body.models ?? []).map((model) => ({
      model_id: model.model_id ?? '',
      name: stringOrNull(model.name),
      language: stringOrNull(model.language),
      version: stringOrNull(model.version),
    })),
    processing_methods: stringList(body.processing_methods),
    features: stringList(body.features),
  };
}

function flattenUsageSummary(body: UsageSummaryResponse): FlatUsageSummary {
  const results = (body.results ?? []).map((row) => ({
    start: stringOrNull(row.start),
    end: stringOrNull(row.end),
    hours: numberOrNull(row.hours) ?? 0,
    total_hours: numberOrNull(row.total_hours) ?? 0,
    requests: numberOrNull(row.requests) ?? 0,
    tts_characters: numberOrNull(row.tts?.characters) ?? 0,
    tts_requests: numberOrNull(row.tts?.requests) ?? 0,
    tokens_in: numberOrNull(row.tokens?.in) ?? 0,
    tokens_out: numberOrNull(row.tokens?.out) ?? 0,
  }));
  const sum = (pick: (row: (typeof results)[number]) => number) =>
    results.reduce((total, row) => total + pick(row), 0);
  return {
    start: stringOrNull(body.start),
    end: stringOrNull(body.end),
    resolution: body.resolution
      ? `${body.resolution.amount ?? 1} ${body.resolution.units ?? ''}`.trim()
      : null,
    total_hours: roundToMillionths(sum((row) => row.total_hours)),
    total_requests: sum((row) => row.requests),
    total_tts_characters: sum((row) => row.tts_characters),
    total_tts_requests: sum((row) => row.tts_requests),
    total_tokens_in: sum((row) => row.tokens_in),
    total_tokens_out: sum((row) => row.tokens_out),
    results,
  };
}

function flattenBillingFields(body: BillingFieldsResponse): FlatBillingFields {
  const lineItems =
    body.line_items !== null && typeof body.line_items === 'object'
      ? Object.entries(body.line_items)
      : [];
  return {
    accessors: stringList(body.accessors),
    deployments: stringList(body.deployments),
    tags: stringList(body.tags),
    line_items: lineItems.map(([line_item, description]) => ({
      line_item,
      description: typeof description === 'string' ? description : null,
    })),
  };
}

function flattenPurchase(order: PurchaseRow): FlatPurchase {
  return {
    order_id: order.order_id ?? '',
    created: stringOrNull(order.created),
    expiration: stringOrNull(order.expiration),
    amount: numberOrNull(order.amount),
    units: stringOrNull(order.units),
    order_type: stringOrNull(order.order_type),
  };
}

export const deepgramReports = {
  flattenUsageFields,
  flattenUsageSummary,
  flattenBillingFields,
  flattenPurchase,
  stripTagPrefix,
  flattenRequest,
  flattenUsage,
  flattenBilling,
  toDay,
  toInstant,
  checkRange,
  joinList,
};

export type RequestRow = {
  request_id?: string;
  project_uuid?: string;
  created?: string;
  path?: string;
  api_key_id?: string;
  code?: number;
  deployment?: string;
  callback?: { attempts?: number; code?: number } | string | null;
  response?: {
    code?: number;
    completed?: string;
    deployment?: string;
    details?: {
      channels?: number;
      duration?: number;
      total_audio?: number;
      method?: string;
      models?: string[];
      features?: string[];
      tags?: string[];
      usd?: number;
      tier?: string;
    };
  };
};

export type FlatRequest = {
  request_id: string;
  created: string | null;
  completed: string | null;
  endpoint: string | null;
  path: string | null;
  api_key_id: string | null;
  status_code: number | null;
  method: string | null;
  deployment: string | null;
  duration_seconds: number | null;
  total_audio_seconds: number | null;
  channels: number | null;
  usd: number | null;
  models: string;
  features: string;
  tags: string;
  tier: string | null;
  callback_status_code: number | null;
  callback_attempts: number | null;
};

export type UsageBreakdownResponse = {
  start?: string;
  end?: string;
  resolution?: { units?: string; amount?: number };
  results?: {
    hours?: number;
    total_hours?: number;
    agent_hours?: number;
    tokens_in?: number;
    tokens_out?: number;
    tts_characters?: number;
    requests?: number;
    grouping?: {
      start?: string;
      end?: string;
      accessor?: string;
      endpoint?: string;
      feature_set?: string;
      models?: string[];
      method?: string;
      tags?: string[];
      deployment?: string;
    };
  }[];
};

export type FlatUsage = {
  start: string | null;
  end: string | null;
  resolution: string | null;
  total_hours: number;
  total_requests: number;
  total_tts_characters: number;
  total_tokens_in: number;
  total_tokens_out: number;
  results: {
    start: string | null;
    end: string | null;
    hours: number;
    total_hours: number;
    agent_hours: number;
    requests: number;
    tts_characters: number;
    tokens_in: number;
    tokens_out: number;
    endpoint: string | null;
    method: string | null;
    models: string;
    tags: string;
    accessor: string | null;
    feature_set: string | null;
    deployment: string | null;
  }[];
};

export type BillingBreakdownResponse = {
  start?: string;
  end?: string;
  results?: {
    dollars?: number;
    grouping?: {
      start?: string;
      end?: string;
      accessor?: string;
      deployment?: string;
      line_item?: string;
      tags?: string[];
    };
  }[];
};

export type FlatBilling = {
  start: string | null;
  end: string | null;
  total_dollars: number;
  results: {
    dollars: number;
    start: string | null;
    end: string | null;
    line_item: string | null;
    accessor: string | null;
    deployment: string | null;
    tags: string;
  }[];
};

export type UsageFieldsResponse = {
  accessors?: string[];
  tags?: string[];
  models?: {
    name?: string;
    language?: string;
    version?: string;
    model_id?: string;
  }[];
  processing_methods?: string[];
  features?: string[];
};

export type FlatUsageFields = {
  accessors: string[];
  tags: string[];
  models: {
    model_id: string;
    name: string | null;
    language: string | null;
    version: string | null;
  }[];
  processing_methods: string[];
  features: string[];
};

export type BillingFieldsResponse = {
  accessors?: string[];
  deployments?: string[];
  tags?: string[];
  line_items?: Record<string, unknown> | null;
};

export type FlatBillingFields = {
  accessors: string[];
  deployments: string[];
  tags: string[];
  line_items: { line_item: string; description: string | null }[];
};

export type PurchaseRow = {
  order_id?: string;
  expiration?: string;
  created?: string;
  amount?: number;
  units?: string;
  order_type?: string;
};

export type FlatPurchase = {
  order_id: string;
  created: string | null;
  expiration: string | null;
  amount: number | null;
  units: string | null;
  order_type: string | null;
};

export type UsageSummaryResponse = {
  start?: string;
  end?: string;
  resolution?: { units?: string; amount?: number };
  results?: {
    start?: string;
    end?: string;
    hours?: number;
    total_hours?: number;
    requests?: number;
    tokens?: { in?: number; out?: number };
    tts?: { characters?: number; requests?: number };
  }[];
};

export type FlatUsageSummary = {
  start: string | null;
  end: string | null;
  resolution: string | null;
  total_hours: number;
  total_requests: number;
  total_tts_characters: number;
  total_tts_requests: number;
  total_tokens_in: number;
  total_tokens_out: number;
  results: {
    start: string | null;
    end: string | null;
    hours: number;
    total_hours: number;
    requests: number;
    tts_characters: number;
    tts_requests: number;
    tokens_in: number;
    tokens_out: number;
  }[];
};
