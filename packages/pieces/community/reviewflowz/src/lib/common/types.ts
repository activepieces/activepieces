export type ReviewflowzEnvelope = {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
};

export type ReviewflowzEvent = {
  type: string;
  group: string;
  label: string;
  description: string;
  important: boolean;
  detail: string;
  sample: ReviewflowzEnvelope;
};

export type ReviewflowzPage<T> = {
  data: T[];
  has_more?: boolean;
  next_cursor?: string | null;
};

export type ReviewflowzProblem = {
  title?: string;
  detail?: string;
  code?: string;
  errors?: { field?: string; detail?: string }[];
};

export type ReviewflowzAccount = {
  id: string;
  name: string;
  campaign_destinations?: 'platform' | 'source';
  member?: { name?: string; email?: string } | null;
};

export type ReviewflowzCampaign = {
  id: string;
  name: string;
  channel: string;
  state: string;
  destinations?: {
    platform?: string;
    source?: string;
    goal?: string;
    target?: number | null;
  }[];
  blockers?: string[];
};

export type ReviewflowzContactAttribute = {
  name: string;
  data_type?: string;
};

export type ReviewflowzWebhookEndpoint = {
  id: string;
  secret?: string;
};

export type ReviewflowzNamedRow = {
  id: string;
  name?: string;
};
