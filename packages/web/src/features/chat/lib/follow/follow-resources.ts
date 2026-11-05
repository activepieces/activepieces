import { isObject } from '@activepieces/core-utils';
import { QueryKey } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

// Which chat tools edit which resource, and how the app shows that resource.
// The follow-along logic (follow-along.ts) reads this one map for every tool
// call, whether it came from the server or the demo backend.

export type FollowResourceKind = 'flow' | 'table' | 'agent';

export type FollowResource = {
  kind: FollowResourceKind;
  id: string;
  // A name the tool call itself carries (e.g. the name of a flow it creates).
  name?: string;
};

type ToolArgs = { input: Record<string, unknown>; output: unknown };

type ToolSpec = {
  kind: FollowResourceKind;
  // The id is in the input for edits, and only in the output for creates.
  id: (args: ToolArgs) => string | null;
  name?: (args: ToolArgs) => string | null;
};

type KindSpec = {
  // Path segment of the resource's page: /projects/:p/<segment>/:id
  segment: string;
  // Query keys to invalidate once a tool call on it finishes.
  queryKeys: (id: string) => QueryKey[];
};

const KINDS: Record<FollowResourceKind, KindSpec> = {
  flow: {
    segment: 'flows',
    // The open builder refreshes its own draft (see useRefreshDraftOnFollow);
    // its page query is left alone so the builder never remounts.
    queryKeys: () => [['flows']],
  },
  table: {
    segment: 'tables',
    queryKeys: (id) => [
      ['table', id],
      ['fields', id],
      ['records', id],
      ['tables'],
    ],
  },
  agent: {
    segment: 'agents',
    queryKeys: () => [['agents']],
  },
};

const TOOLS: Record<string, ToolSpec> = {
  ap_create_flow: {
    kind: 'flow',
    id: ({ output }) => fromOutput(output, ['flowId']),
    name: ({ input }) => str(input.flowName),
  },
  ap_add_step: { kind: 'flow', id: ({ input }) => str(input.flowId) },
  ap_update_step: { kind: 'flow', id: ({ input }) => str(input.flowId) },
  ap_create_table: {
    kind: 'table',
    id: ({ output }) => fromOutput(output, ['tableId', 'id']),
    name: ({ input }) => str(input.name),
  },
  ap_insert_records: { kind: 'table', id: ({ input }) => str(input.tableId) },
  ap_update_record: { kind: 'table', id: ({ input }) => str(input.tableId) },
  ap_manage_fields: { kind: 'table', id: ({ input }) => str(input.tableId) },
  ap_create_agent: {
    kind: 'agent',
    id: ({ output }) => fromOutput(output, ['agentId', 'id']),
    name: ({ input }) => str(input.displayName) ?? str(input.name),
  },
  ap_update_agent: {
    kind: 'agent',
    id: ({ input, output }) =>
      str(input.agentId) ?? fromOutput(output, ['agentId', 'id']),
  },
};

function kindOf(toolName: string): FollowResourceKind | null {
  return TOOLS[toolName]?.kind ?? null;
}

function resolve({
  toolName,
  input,
  output,
}: {
  toolName: string;
  input: unknown;
  output?: unknown;
}): FollowResource | null {
  const spec = TOOLS[toolName];
  if (!spec) return null;
  const args = { input: isObject(input) ? input : {}, output };
  const id = spec.id(args);
  if (!id) return null;
  const name = spec.name?.(args) ?? undefined;
  return { kind: spec.kind, id, ...(name ? { name } : {}) };
}

function routeOf({ kind, id }: Pick<FollowResource, 'kind' | 'id'>): string {
  return authenticationSession.appendProjectRoutePrefix(
    `/${KINDS[kind].segment}/${id}`,
  );
}

// True when this pathname is the resource's page (any sub-tab of it too).
function isOn(
  pathname: string,
  { kind, id }: Pick<FollowResource, 'kind' | 'id'>,
): boolean {
  const marker = `/${KINDS[kind].segment}/${id}`;
  const at = pathname.indexOf(marker);
  if (at === -1) return false;
  const next = pathname.charAt(at + marker.length);
  return next === '' || next === '/';
}

function queryKeysOf({ kind, id }: Pick<FollowResource, 'kind' | 'id'>) {
  return KINDS[kind].queryKeys(id);
}

function keyOf({ kind, id }: Pick<FollowResource, 'kind' | 'id'>): string {
  return `${kind}:${id}`;
}

// ---------------------------------------------------------------------------
// Reading ids out of tool output. MCP tools answer with structuredContent, a
// JSON string, or text such as `Created flow "X" (id: abc)`.

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function fromOutput(output: unknown, keys: string[]): string | null {
  const parsed = typeof output === 'string' ? tryParse(output) : output;
  if (isObject(parsed)) {
    for (const source of [parsed.structuredContent, parsed]) {
      if (!isObject(source)) continue;
      for (const key of keys) {
        const value = str(source[key]);
        if (value) return value;
      }
    }
    if (Array.isArray(parsed.content)) {
      for (const item of parsed.content) {
        const text = isObject(item) ? str(item.text) : null;
        const fromText = text ? idInText(text) : null;
        if (fromText) return fromText;
      }
    }
  }
  return typeof parsed === 'string' ? idInText(parsed) : null;
}

function idInText(text: string): string | null {
  return /\(id: ([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? null;
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const followResources = {
  kindOf,
  resolve,
  routeOf,
  isOn,
  queryKeysOf,
  keyOf,
};
