import { isObject, tryCatchSync } from '@activepieces/core-utils';
import { QueryKey } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Bot,
  Folder,
  KeyRound,
  LucideIcon,
  PlayCircle,
  Table2,
  Workflow,
} from 'lucide-react';

import { authenticationSession } from '@/lib/authentication-session';

function resolve({
  toolName,
  input,
  output,
}: {
  toolName: string;
  input: unknown;
  output: unknown;
}): ResolvedCall | null {
  const parsed = parseOutput(output);
  const fromContract = resolveFromContract(parsed);
  if (fromContract) return fromContract;
  const spec = TOOLS[toolName];
  if (!spec) return null;
  const args = { input: isObject(input) ? input : {}, output: parsed };
  const id = spec.id(args);
  if (!id) return null;
  const name = spec.name?.(args) ?? null;
  const projectId = projectIdInOutput(parsed);
  const highlights = spec.highlights?.(args) ?? [];
  return {
    ref: {
      kind: spec.kind,
      id,
      ...(projectId ? { projectId } : {}),
      ...(name ? { name } : {}),
    },
    op: spec.op,
    outcome: outcome(parsed),
    highlights,
  };
}

function isKnownTool(toolName: string): boolean {
  return toolName in TOOLS;
}

function outcome(output: unknown): ResourceOutcome {
  const parsed = parseOutput(output);
  const contract = apResourceOf(parsed);
  if (contract && isOutcome(contract.outcome)) return contract.outcome;
  if (typeof parsed === 'string') return outcomeOfText(parsed) ?? 'applied';
  if (!isObject(parsed)) return 'applied';
  if (parsed.dismissed === true) return 'declined';
  if (parsed.timedOut === true) return 'timeout';
  if (parsed.notShown === true) return 'held';
  const text = firstText(parsed);
  const fromText = text ? outcomeOfText(text) : null;
  if (fromText && fromText !== 'partial') return fromText;
  if (parsed.isError === true || parsed.success === false) return 'failed';
  const structured = parsed.structuredContent;
  if (isObject(structured) && typeof structured.errorSummary === 'string') {
    return 'failed';
  }
  if (typeof parsed.error === 'string') return 'failed';
  return fromText ?? 'applied';
}

function isChange(value: ResourceOutcome): boolean {
  return value === 'applied' || value === 'partial';
}

function route(ref: ResourceRef): string {
  const path = KINDS[ref.kind].path(ref.id);
  const projectId = ref.projectId ?? authenticationSession.getProjectId();
  return projectId ? `/projects/${projectId}${path}` : path;
}

function parentRoute(ref: ResourceRef): string {
  const path = KINDS[ref.kind].parentPath;
  const projectId = ref.projectId ?? authenticationSession.getProjectId();
  return projectId ? `/projects/${projectId}${path}` : path;
}

function isOn(pathname: string, ref: ResourceRef): boolean {
  if (ref.projectId && !pathname.includes(`/projects/${ref.projectId}/`)) {
    return false;
  }
  const marker = KINDS[ref.kind].path(ref.id);
  const at = pathname.indexOf(marker);
  if (at === -1) return false;
  const next = pathname.charAt(at + marker.length);
  return next === '' || next === '/';
}

function isInCurrentProject(ref: ResourceRef): boolean {
  return (
    !ref.projectId || ref.projectId === authenticationSession.getProjectId()
  );
}

function queryKeys(ref: ResourceRef): QueryKey[] {
  return KINDS[ref.kind].queryKeys(ref.id);
}

function keyOf({ kind, id }: Pick<ResourceRef, 'kind' | 'id'>): string {
  return `${kind}:${id}`;
}

function kindInfo(kind: ResourceKind): KindInfo {
  const { icon, label, noun } = KINDS[kind];
  return { icon, label: label(), noun: noun() };
}

function resolveFromContract(output: unknown): ResolvedCall | null {
  const contract = apResourceOf(output);
  if (!contract) return null;
  const { kind, id, op } = contract;
  if (!isKind(kind) || !isOp(op) || typeof id !== 'string' || id === '') {
    return null;
  }
  const projectId = str(contract.projectId);
  const name = str(contract.label);
  return {
    ref: {
      kind,
      id,
      ...(projectId ? { projectId } : {}),
      ...(name ? { name } : {}),
    },
    op,
    outcome: outcome(output),
    highlights: Array.isArray(contract.changes)
      ? contract.changes.flatMap((change) =>
          isObject(change) && typeof change.key === 'string'
            ? [change.key]
            : [],
        )
      : [],
  };
}

function apResourceOf(output: unknown): Record<string, unknown> | null {
  if (!isObject(output) || !isObject(output._meta)) return null;
  const contract = output._meta.apResource;
  return isObject(contract) ? contract : null;
}

function outcomeOfText(text: string): ResourceOutcome | null {
  const trimmed = text.trimStart();
  if (DECLINED_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return 'declined';
  }
  if (trimmed.startsWith(HELD_PREFIX)) return 'held';
  if (trimmed.startsWith('⏳')) return 'timeout';
  if (trimmed.startsWith(FORBIDDEN_PREFIX)) return 'forbidden';
  if (trimmed.startsWith('❌')) return 'failed';
  if (trimmed.startsWith('⚠️')) return 'partial';
  return null;
}

function firstText(output: Record<string, unknown>): string | null {
  if (Array.isArray(output.content)) {
    const first = output.content[0];
    if (isObject(first) && typeof first.text === 'string') return first.text;
  }
  return str(output.error) ?? str(output.message);
}

function parseOutput(output: unknown): unknown {
  if (typeof output !== 'string') return output;
  const { data } = tryCatchSync<unknown>(() => JSON.parse(output));
  return isObject(data) ? data : output;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function fromOutput(output: unknown, keys: string[]): string | null {
  if (isObject(output)) {
    for (const source of [output.structuredContent, output]) {
      if (!isObject(source)) continue;
      for (const key of keys) {
        const value = str(source[key]);
        if (value) return value;
      }
    }
  }
  const text = isObject(output) ? firstText(output) : str(output);
  return text ? idInText(text) : null;
}

function idInText(text: string): string | null {
  return /\(id: ([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? null;
}

function copyIdInText(output: unknown): string | null {
  const text = isObject(output) ? firstText(output) : str(output);
  return text
    ? /Copy: ".*" \(id: ([A-Za-z0-9_-]+)\)/.exec(text)?.[1] ?? null
    : null;
}

function runIdInText(output: unknown): string | null {
  const text = isObject(output) ? firstText(output) : str(output);
  return text ? /\bRun ([A-Za-z0-9_-]+) —/.exec(text)?.[1] ?? null : null;
}

function projectIdInOutput(output: unknown): string | null {
  if (!isObject(output)) return null;
  for (const source of [output.structuredContent, output]) {
    if (!isObject(source)) continue;
    for (const key of ['flowUrl', 'url']) {
      const url = str(source[key]);
      const match = url ? /\/projects\/([A-Za-z0-9_-]+)\//.exec(url) : null;
      if (match) return match[1];
    }
  }
  return null;
}

function isKind(value: unknown): value is ResourceKind {
  return typeof value === 'string' && value in KINDS;
}

function isOp(value: unknown): value is ResourceOp {
  return (
    typeof value === 'string' &&
    ['create', 'update', 'delete', 'run', 'view'].includes(value)
  );
}

function isOutcome(value: unknown): value is ResourceOutcome {
  return (
    typeof value === 'string' &&
    [
      'applied',
      'partial',
      'failed',
      'declined',
      'timeout',
      'held',
      'forbidden',
    ].includes(value)
  );
}

const DECLINED_PREFIXES = [
  'The user declined',
  'Live test cancelled by the user',
  'Action cancelled by user',
  'The user chose not to',
];
const HELD_PREFIX = 'Not run: you asked the user a question';
const FORBIDDEN_PREFIX = '❌ Permission denied';

const AUTOMATIONS_LIST_KEYS: QueryKey[] = [
  ['root-flows'],
  ['root-tables'],
  ['all-folder-contents'],
  ['folders'],
];

const KINDS: Record<ResourceKind, KindSpec> = {
  flow: {
    path: (id) => `/flows/${id}`,
    parentPath: '/automations',
    queryKeys: () => [['flows'], ...AUTOMATIONS_LIST_KEYS],
    icon: Workflow,
    label: () => t('Flow'),
    noun: () => t('flow'),
  },
  table: {
    path: (id) => `/tables/${id}`,
    parentPath: '/automations',
    queryKeys: (id) => [
      ['table', id],
      ['fields', id],
      ['records', id],
      ['tables'],
      ...AUTOMATIONS_LIST_KEYS,
    ],
    icon: Table2,
    label: () => t('Table'),
    noun: () => t('table'),
  },
  agent: {
    path: (id) => `/agents/${id}`,
    parentPath: '/automations',
    queryKeys: () => [['agents'], ['all-folder-contents']],
    icon: Bot,
    label: () => t('Agent'),
    noun: () => t('agent'),
  },
  run: {
    path: (id) => `/runs/${id}`,
    parentPath: '/runs',
    queryKeys: (id) => [
      ['run', id],
      ['flow-run-table'],
      ['flow-runs'],
      ['flow-run-count-by-status'],
    ],
    icon: PlayCircle,
    label: () => t('Run'),
    noun: () => t('run'),
  },
  connection: {
    path: () => '/connections',
    parentPath: '/connections',
    queryKeys: () => [['app-connections']],
    icon: KeyRound,
    label: () => t('Connection'),
    noun: () => t('connection'),
  },
  folder: {
    path: () => '/automations',
    parentPath: '/automations',
    queryKeys: () => AUTOMATIONS_LIST_KEYS,
    icon: Folder,
    label: () => t('Folder'),
    noun: () => t('folder'),
  },
};

const flowInput: ToolSpec['id'] = ({ input }) => str(input.flowId);
const tableInput: ToolSpec['id'] = ({ input }) => str(input.tableId);
const agentInputOrOutput: ToolSpec['id'] = ({ input, output }) =>
  str(input.agentId) ?? fromOutput(output, ['agentId']);
const stepHighlight: ToolSpec['highlights'] = ({ input, output }) => {
  const stepName = str(input.stepName) ?? fromOutput(output, ['stepName']);
  return stepName ? [`flow-step:${stepName}`] : [];
};

const TOOLS: Record<string, ToolSpec> = {
  ap_build_flow: {
    kind: 'flow',
    op: 'create',
    id: ({ output }) => fromOutput(output, ['flowId']),
    name: ({ input }) => str(input.flowName),
  },
  ap_create_flow: {
    kind: 'flow',
    op: 'create',
    id: ({ output }) => fromOutput(output, ['flowId']),
    name: ({ input }) => str(input.flowName),
  },
  ap_add_step: {
    kind: 'flow',
    op: 'update',
    id: flowInput,
    highlights: stepHighlight,
  },
  ap_update_step: {
    kind: 'flow',
    op: 'update',
    id: flowInput,
    highlights: stepHighlight,
  },
  ap_delete_step: { kind: 'flow', op: 'update', id: flowInput },
  ap_update_trigger: {
    kind: 'flow',
    op: 'update',
    id: flowInput,
    highlights: () => ['flow-step:trigger'],
  },
  ap_add_branch: { kind: 'flow', op: 'update', id: flowInput },
  ap_update_branch: { kind: 'flow', op: 'update', id: flowInput },
  ap_delete_branch: { kind: 'flow', op: 'update', id: flowInput },
  ap_rename_flow: {
    kind: 'flow',
    op: 'update',
    id: flowInput,
    name: ({ input }) => str(input.displayName),
  },
  ap_change_flow_status: { kind: 'flow', op: 'update', id: flowInput },
  ap_lock_and_publish: { kind: 'flow', op: 'update', id: flowInput },
  ap_manage_notes: { kind: 'flow', op: 'update', id: flowInput },
  ap_move_flow_to_folder: { kind: 'flow', op: 'update', id: flowInput },
  ap_duplicate_flow: {
    kind: 'flow',
    op: 'create',
    id: ({ output }) => copyIdInText(output),
    name: ({ input }) => str(input.name),
  },
  ap_delete_flow: { kind: 'flow', op: 'delete', id: flowInput },
  ap_test_flow: { kind: 'flow', op: 'run', id: flowInput },
  ap_test_step: {
    kind: 'flow',
    op: 'run',
    id: flowInput,
    highlights: stepHighlight,
  },
  ap_retry_run: {
    kind: 'run',
    op: 'run',
    id: ({ input, output }) => runIdInText(output) ?? str(input.flowRunId),
  },
  ap_create_folder: {
    kind: 'folder',
    op: 'create',
    id: ({ output }) => fromOutput(output, ['folderId']),
    name: ({ input, output }) =>
      fromOutput(output, ['folderName']) ?? str(input.folderName),
  },
  ap_create_table: {
    kind: 'table',
    op: 'create',
    id: ({ output }) => fromOutput(output, ['id', 'tableId']),
    name: ({ input }) => str(input.name),
  },
  ap_insert_records: { kind: 'table', op: 'update', id: tableInput },
  ap_update_record: {
    kind: 'table',
    op: 'update',
    id: tableInput,
    highlights: ({ input }) => {
      const recordId = str(input.recordId);
      return recordId ? [`table-row:${recordId}`] : [];
    },
  },
  ap_delete_records: { kind: 'table', op: 'update', id: tableInput },
  ap_manage_fields: { kind: 'table', op: 'update', id: tableInput },
  ap_delete_table: { kind: 'table', op: 'delete', id: tableInput },
  ap_create_agent: {
    kind: 'agent',
    op: 'create',
    id: ({ output }) => fromOutput(output, ['agentId']),
    name: ({ input, output }) =>
      fromOutput(output, ['displayName']) ??
      str(input.displayName) ??
      str(input.name),
  },
  ap_update_agent: { kind: 'agent', op: 'update', id: agentInputOrOutput },
  ap_add_agent_tool: { kind: 'agent', op: 'update', id: agentInputOrOutput },
  ap_remove_agent_tool: {
    kind: 'agent',
    op: 'update',
    id: agentInputOrOutput,
  },
};

export const resourceRegistry = {
  resolve,
  isKnownTool,
  outcome,
  isChange,
  route,
  parentRoute,
  isOn,
  isInCurrentProject,
  queryKeys,
  keyOf,
  kindInfo,
};

export type ResourceKind =
  | 'flow'
  | 'table'
  | 'agent'
  | 'run'
  | 'connection'
  | 'folder';

export type ResourceOp = 'create' | 'update' | 'delete' | 'run' | 'view';

export type ResourceOutcome =
  | 'applied'
  | 'partial'
  | 'failed'
  | 'declined'
  | 'timeout'
  | 'held'
  | 'forbidden';

export type ResourceRef = {
  kind: ResourceKind;
  id: string;
  projectId?: string;
  name?: string;
};

export type ResolvedCall = {
  ref: ResourceRef;
  op: ResourceOp;
  outcome: ResourceOutcome;
  highlights: string[];
};

type KindInfo = { icon: LucideIcon; label: string; noun: string };

type ToolArgs = { input: Record<string, unknown>; output: unknown };

type ToolSpec = {
  kind: ResourceKind;
  op: ResourceOp;
  id: (args: ToolArgs) => string | null;
  name?: (args: ToolArgs) => string | null;
  highlights?: (args: ToolArgs) => string[];
};

type KindSpec = {
  path: (id: string) => string;
  parentPath: string;
  queryKeys: (id: string) => QueryKey[];
  icon: LucideIcon;
  label: () => string;
  noun: () => string;
};
