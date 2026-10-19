export const agentEfforts = {
  ALL: ['minimal', 'low', 'medium', 'high', 'xhigh', 'auto', 'ultra'],
  METERED: ['auto', 'ultra'],
  DEFAULT: 'low',
  OPTIONS: [
    { label: 'Minimal ($0.012 per run)', value: 'minimal' },
    { label: 'Low ($0.025 per run)', value: 'low' },
    { label: 'Medium ($0.10 per run)', value: 'medium' },
    { label: 'High ($0.50 per run)', value: 'high' },
    { label: 'Extra High ($1.00 per run)', value: 'xhigh' },
    { label: 'Auto (metered, up to $5 by default)', value: 'auto' },
    { label: 'Ultra (metered, up to $20 by default)', value: 'ultra' },
  ],
};

export const agentRuns = { flattenRun, summarizeRun };

function flattenRun(run: AgentRun): FlatAgentRun {
  return {
    id: run.id,
    status: run.status,
    stop_reason: run.stopReason ?? null,
    created_at: run.createdAt ?? null,
    completed_at: run.completedAt ?? null,
    query: run.request?.query ?? null,
    effort: run.request?.effort ?? null,
    output_text: run.output?.text ?? null,
    output_structured: run.output?.structured ?? null,
    citations: citationsOf(run.output?.grounding),
    search_count: run.usage?.searches ?? null,
    agent_compute_units: run.usage?.agentComputeUnits ?? null,
    cost_total: run.costDollars?.total ?? null,
  };
}

function summarizeRun(run: AgentRun): AgentRunSummary {
  return {
    id: run.id,
    status: run.status,
    stop_reason: run.stopReason ?? null,
    created_at: run.createdAt ?? null,
    completed_at: run.completedAt ?? null,
    query: run.request?.query ?? null,
    effort: run.request?.effort ?? null,
    cost_total: run.costDollars?.total ?? null,
  };
}

function citationsOf(grounding: AgentGrounding[] | undefined): FlatCitation[] {
  if (!Array.isArray(grounding)) {
    return [];
  }
  return grounding.flatMap((entry) =>
    (entry.citations ?? []).map((citation) => ({
      field: entry.field ?? null,
      url: citation.url,
      title: citation.title ?? null,
      confidence: entry.confidence ?? null,
    })),
  );
}

export type AgentGrounding = {
  field?: string;
  citations?: { url: string; title?: string }[];
  confidence?: string | null;
};

export type AgentRun = {
  id: string;
  object?: string;
  status: string;
  stopReason?: string | null;
  createdAt?: string;
  completedAt?: string | null;
  request?: { query?: string; effort?: string } | null;
  output?: {
    text?: string;
    structured?: unknown;
    grounding?: AgentGrounding[];
  };
  usage?: { agentComputeUnits?: number; searches?: number };
  costDollars?: { total?: number };
};

export type AgentRunList = {
  object?: string;
  data: AgentRun[];
  hasMore?: boolean;
  nextCursor?: string | null;
};

export type FlatCitation = {
  field: string | null;
  url: string;
  title: string | null;
  confidence: string | null;
};

export type AgentRunSummary = {
  id: string;
  status: string;
  stop_reason: string | null;
  created_at: string | null;
  completed_at: string | null;
  query: string | null;
  effort: string | null;
  cost_total: number | null;
};

export type FlatAgentRun = AgentRunSummary & {
  output_text: string | null;
  output_structured: unknown;
  citations: FlatCitation[];
  search_count: number | null;
  agent_compute_units: number | null;
};
