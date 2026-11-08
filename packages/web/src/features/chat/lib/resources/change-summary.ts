import { isObject } from '@activepieces/core-utils';

import { AnyToolPart, ChatUIMessage, chatPartUtils } from '../chat-types';

import {
  ResolvedCall,
  ResourceOutcome,
  ResourceRef,
  resourceRegistry,
} from './registry';

function summarize(calls: readonly ToolCallRecord[]): ChangeLine[] {
  const lines = new Map<string, LineDraft>();
  for (const call of dedupe(calls)) {
    const resolved = resolveCall(call);
    if (!resolved || IGNORED_OPS.has(resolved.op)) continue;
    if (resolved.outcome === 'held') continue;
    const key = resourceRegistry.keyOf(resolved.ref);
    const draft = lines.get(key) ?? emptyDraft(resolved.ref);
    lines.set(key, addCall({ draft, call, resolved }));
  }
  return [...lines.values()].map(finish);
}

function fromToolParts(
  parts: readonly ChatUIMessage['parts'][number][],
): ToolCallRecord[] {
  return parts.flatMap((part) => {
    const record = chatPartUtils.isAnyToolPart(part)
      ? toolCallOfPart(part)
      : null;
    return record ? [record] : [];
  });
}

function toolCallOfPart(part: AnyToolPart): ToolCallRecord | null {
  const { state } = part;
  if (
    state !== 'output-available' &&
    state !== 'output-error' &&
    state !== 'output-denied'
  ) {
    return null;
  }
  return {
    toolCallId: chatPartUtils.getToolCallId(part) || null,
    toolName: chatPartUtils.getToolPartName(part),
    input: part.input,
    output:
      part.state === 'output-available'
        ? part.output
        : part.state === 'output-error'
        ? part.errorText
        : undefined,
    state,
  };
}

function resolveCall(call: ToolCallRecord): ResolvedCall | null {
  const resolved = resourceRegistry.resolve({
    toolName: call.toolName,
    input: call.input,
    output: call.output,
  });
  if (!resolved) return null;
  if (call.state === 'output-error') return { ...resolved, outcome: 'failed' };
  if (call.state === 'output-denied') {
    return { ...resolved, outcome: 'declined' };
  }
  return resolved;
}

function addCall({
  draft,
  call,
  resolved,
}: {
  draft: LineDraft;
  call: ToolCallRecord;
  resolved: ResolvedCall;
}): LineDraft {
  const ref: ResourceRef = {
    ...draft.ref,
    ...(resolved.ref.name ? { name: resolved.ref.name } : {}),
    ...(resolved.ref.projectId ? { projectId: resolved.ref.projectId } : {}),
  };
  if (!resourceRegistry.isChange(resolved.outcome)) {
    return {
      ...draft,
      ref,
      failures: [...draft.failures, failureOf(resolved.outcome)],
    };
  }
  const facts = addFacts({
    facts: draft.facts,
    call,
    resolved,
  });
  return {
    ...draft,
    ref,
    facts,
    successes: draft.successes + 1,
    partial: draft.partial || resolved.outcome === 'partial',
    draft: DRAFT_TOOLS.has(call.toolName)
      ? true
      : call.toolName === 'ap_lock_and_publish'
      ? false
      : draft.draft,
  };
}

function addFacts({
  facts,
  call,
  resolved,
}: {
  facts: ChangeFacts;
  call: ToolCallRecord;
  resolved: ResolvedCall;
}): ChangeFacts {
  const input = isObject(call.input) ? call.input : {};
  const text = outputText(call.output);
  const base: ChangeFacts = {
    ...facts,
    created: facts.created || resolved.op === 'create',
    deleted: facts.deleted || resolved.op === 'delete',
  };
  switch (call.toolName) {
    case 'ap_insert_records': {
      const requested = Array.isArray(input.records) ? input.records.length : 0;
      const counted = countIn({ text, pattern: /Inserted (\d+) record/ });
      const partly = partOf(text);
      const added = partly?.done ?? counted ?? requested;
      return {
        ...base,
        rowsAdded: facts.rowsAdded + added,
        rowsRequested:
          facts.rowsRequested + Math.max(requested, partly?.total ?? 0, added),
      };
    }
    case 'ap_update_record':
      return { ...base, rowsUpdated: facts.rowsUpdated + 1 };
    case 'ap_delete_records': {
      const requested = Array.isArray(input.recordIds)
        ? input.recordIds.length
        : 0;
      const counted = countIn({ text, pattern: /Deleted (\d+) record/ });
      return {
        ...base,
        rowsDeleted: facts.rowsDeleted + (counted ?? requested),
      };
    }
    case 'ap_manage_fields':
      return { ...base, fieldsChanged: facts.fieldsChanged + 1 };
    case 'ap_build_flow':
      return {
        ...base,
        stepsAdded:
          facts.stepsAdded +
          (countIn({ text, pattern: /with (\d+) step/ }) ?? 0),
      };
    case 'ap_add_step':
      return { ...base, stepsAdded: facts.stepsAdded + 1 };
    case 'ap_delete_step':
      return { ...base, stepsRemoved: facts.stepsRemoved + 1 };
    case 'ap_update_step':
    case 'ap_update_trigger':
    case 'ap_add_branch':
    case 'ap_update_branch':
    case 'ap_delete_branch':
      return { ...base, stepsUpdated: facts.stepsUpdated + 1 };
    case 'ap_lock_and_publish':
      return { ...base, published: true };
    case 'ap_change_flow_status':
      return { ...base, statusChanged: true };
    case 'ap_rename_flow':
      return { ...base, renamed: true };
    default:
      return { ...base, otherChanges: base.otherChanges + 1 };
  }
}

function finish(draft: LineDraft): ChangeLine {
  const { ref, facts, successes, failures } = draft;
  const short = facts.rowsAdded < facts.rowsRequested;
  const state: ChangeState =
    successes === 0
      ? failures[failures.length - 1] ?? 'failed'
      : draft.partial || short || failures.length > 0
      ? 'partial'
      : 'applied';
  return {
    key: resourceRegistry.keyOf(ref),
    ref,
    state,
    facts,
    draft: ref.kind === 'flow' && draft.draft && !facts.deleted,
  };
}

function failureOf(outcome: ResourceOutcome): FailureState {
  if (outcome === 'declined' || outcome === 'forbidden') return outcome;
  return 'failed';
}

function dedupe(calls: readonly ToolCallRecord[]): ToolCallRecord[] {
  const seen = new Set<string>();
  return calls.filter((call) => {
    if (!call.toolCallId) return true;
    if (seen.has(call.toolCallId)) return false;
    seen.add(call.toolCallId);
    return true;
  });
}

function emptyDraft(ref: ResourceRef): LineDraft {
  return {
    ref,
    facts: { ...EMPTY_FACTS },
    successes: 0,
    failures: [],
    partial: false,
    draft: false,
  };
}

function outputText(output: unknown): string {
  if (typeof output === 'string') return output;
  return isObject(output) ? resourceRegistry.firstText(output) ?? '' : '';
}

function countIn({
  text,
  pattern,
}: {
  text: string;
  pattern: RegExp;
}): number | null {
  const match = pattern.exec(text);
  return match ? Number(match[1]) : null;
}

function partOf(text: string): { done: number; total: number } | null {
  const match = /(\d+) of (\d+)/.exec(text);
  return match ? { done: Number(match[1]), total: Number(match[2]) } : null;
}

const IGNORED_OPS = new Set(['run', 'view']);

const DRAFT_TOOLS = new Set([
  'ap_build_flow',
  'ap_create_flow',
  'ap_duplicate_flow',
  'ap_add_step',
  'ap_update_step',
  'ap_delete_step',
  'ap_update_trigger',
  'ap_add_branch',
  'ap_update_branch',
  'ap_delete_branch',
  'ap_rename_flow',
  'ap_manage_notes',
]);

const EMPTY_FACTS: ChangeFacts = {
  created: false,
  deleted: false,
  rowsAdded: 0,
  rowsRequested: 0,
  rowsUpdated: 0,
  rowsDeleted: 0,
  fieldsChanged: 0,
  stepsAdded: 0,
  stepsUpdated: 0,
  stepsRemoved: 0,
  published: false,
  statusChanged: false,
  renamed: false,
  otherChanges: 0,
};

export const changeSummaryUtils = {
  summarize,
  fromToolParts,
};

export type ToolCallRecord = {
  toolCallId: string | null;
  toolName: string;
  input: unknown;
  output: unknown;
  state: 'output-available' | 'output-error' | 'output-denied';
};

export type ChangeState = 'applied' | 'partial' | FailureState;

export type ChangeFacts = {
  created: boolean;
  deleted: boolean;
  rowsAdded: number;
  rowsRequested: number;
  rowsUpdated: number;
  rowsDeleted: number;
  fieldsChanged: number;
  stepsAdded: number;
  stepsUpdated: number;
  stepsRemoved: number;
  published: boolean;
  statusChanged: boolean;
  renamed: boolean;
  otherChanges: number;
};

export type ChangeLine = {
  key: string;
  ref: ResourceRef;
  state: ChangeState;
  facts: ChangeFacts;
  draft: boolean;
};

type FailureState = 'failed' | 'declined' | 'forbidden';

type LineDraft = {
  ref: ResourceRef;
  facts: ChangeFacts;
  successes: number;
  failures: FailureState[];
  partial: boolean;
  draft: boolean;
};
