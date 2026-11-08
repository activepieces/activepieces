import { isObject, tryCatch } from '@activepieces/core-utils';
import { HttpStatusCode } from 'axios';
import { useEffect, useRef } from 'react';

import { agentsApi } from '@/features/agents/api/agents';
import { flowsApi } from '@/features/flows';
import { tablesApi } from '@/features/tables';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { useChatStoreContext } from './chat-store-context';
import { ChatUIMessage, chatPartUtils } from './chat-types';
import { followAlong } from './follow/follow-along';
import {
  ResourceKind,
  ResourceRef,
  resourceRegistry,
} from './resources/registry';

export function useOpenResourceRequests({
  lastAssistantMessage,
  isStreaming,
}: {
  lastAssistantMessage: ChatUIMessage | undefined;
  isStreaming: boolean;
}): void {
  const approveGate = useChatStoreContext((s) => s.approveGate);
  const dismissedGateIds = useChatStoreContext((s) => s.dismissedGateIds);
  const handled = useRef(new Set<string>());
  const part = chatPartUtils.findLastToolPart({
    message: lastAssistantMessage,
    predicate: (name, p) =>
      name === OPEN_RESOURCE_TOOL && p.state === 'input-available',
  });
  const toolCallId = part ? chatPartUtils.getToolCallId(part) : null;
  const inputRef = useRef<unknown>(null);
  inputRef.current = part?.input ?? null;

  useEffect(() => {
    if (!toolCallId || !isStreaming) return;
    if (handled.current.has(toolCallId) || dismissedGateIds[toolCallId]) {
      return;
    }
    handled.current.add(toolCallId);
    openFromInput(inputRef.current)
      .catch((): OpenResult => ({ opened: false, reason: 'not_found' }))
      .then((result) => approveGate(toolCallId, result))
      .catch(() => undefined);
  }, [toolCallId, isStreaming, dismissedGateIds, approveGate]);
}

async function openFromInput(input: unknown): Promise<OpenResult> {
  if (
    !isObject(input) ||
    !resourceRegistry.isKind(input.kind) ||
    typeof input.id !== 'string' ||
    input.id === ''
  ) {
    return { opened: false, reason: 'not_found' };
  }
  const projectId =
    typeof input.projectId === 'string' && input.projectId !== ''
      ? input.projectId
      : null;
  const ref: ResourceRef = {
    kind: input.kind,
    id: input.id,
    ...(projectId ? { projectId } : {}),
  };
  if (
    authenticationSession.getProjectId() !== null &&
    !resourceRegistry.isInCurrentProject(ref)
  ) {
    return { opened: false, reason: 'other_project' };
  }
  const denied = await accessProblem(ref);
  if (denied) return { opened: false, reason: denied };
  followAlong.view(ref);
  return { opened: true };
}

async function accessProblem(
  ref: ResourceRef,
): Promise<'no_access' | 'not_found' | null> {
  const fetchOne = FETCHERS[ref.kind];
  if (!fetchOne) return null;
  const { error } = await tryCatch(() => fetchOne(ref.id));
  if (!error) return null;
  const status = api.isError(error) ? error.response?.status : undefined;
  return status === HttpStatusCode.Forbidden ||
    status === HttpStatusCode.Unauthorized
    ? 'no_access'
    : 'not_found';
}

const OPEN_RESOURCE_TOOL = 'ap_open_resource';

const FETCHERS: Partial<
  Record<ResourceKind, (id: string) => Promise<unknown>>
> = {
  flow: (id) => flowsApi.get(id),
  table: (id) => tablesApi.getById(id),
  agent: (id) => agentsApi.get(id),
};

type OpenResult =
  | { opened: true }
  | { opened: false; reason: 'no_access' | 'not_found' | 'other_project' };
