import {
  assertNotNullOrUndefined,
  type ChatHistoryMessage,
  ChatConversation,
  ChatStreamEventType,
  CreateChatConversationRequest,
  SeekPage,
  SendChatMessageRequest,
  UpdateChatConversationRequest,
} from '@activepieces/shared';

import { API_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

function getAuthHeaders(): Record<string, string> {
  const token = authenticationSession.getToken();
  assertNotNullOrUndefined(token, 'token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function getProjectId(): string {
  const projectId = authenticationSession.getProjectId();
  assertNotNullOrUndefined(projectId, 'projectId');
  return projectId;
}

async function createConversation(
  request: CreateChatConversationRequest,
): Promise<ChatConversation> {
  const res = await fetch(
    `${API_URL}/v1/chat/conversations?projectId=${getProjectId()}`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    },
  );
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
  return res.json();
}

async function listConversations({
  cursor,
  limit = 20,
}: {
  cursor?: string;
  limit?: number;
}): Promise<SeekPage<ChatConversation>> {
  const params = new URLSearchParams();
  params.set('projectId', getProjectId());
  params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(
    `${API_URL}/v1/chat/conversations?${params.toString()}`,
    { headers: getAuthHeaders() },
  );
  if (!res.ok) throw new Error(`Failed to list conversations: ${res.status}`);
  return res.json();
}

function conversationUrl(id: string): string {
  return `${API_URL}/v1/chat/conversations/${id}?projectId=${getProjectId()}`;
}

async function getMessages(
  conversationId: string,
): Promise<{ data: ChatHistoryMessage[] }> {
  const res = await fetch(
    `${API_URL}/v1/chat/conversations/${conversationId}/messages?projectId=${getProjectId()}`,
    { headers: getAuthHeaders() },
  );
  if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`);
  return res.json();
}

async function updateConversation(
  id: string,
  request: UpdateChatConversationRequest,
): Promise<ChatConversation> {
  const res = await fetch(conversationUrl(id), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Failed to update conversation: ${res.status}`);
  return res.json();
}

async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(conversationUrl(id), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
}

function sendMessage(
  conversationId: string,
  request: SendChatMessageRequest,
  onEvent: (event: ChatStreamEvent) => void,
  onDone: () => void,
  onError: (error: string) => void,
): AbortController {
  const controller = new AbortController();

  fetch(
    `${API_URL}/v1/chat/conversations/${conversationId}/messages?projectId=${getProjectId()}`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      signal: controller.signal,
    },
  )
    .then(async (res) => {
      if (!res.ok) {
        onError(`Server error: ${res.status}`);
        return;
      }
      if (!res.body) {
        onError('No response body');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const MAX_BUFFER_SIZE = 1024 * 1024;
      let buffer = '';
      let doneSignaled = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        if (buffer.length > MAX_BUFFER_SIZE) {
          onError('Response exceeded maximum buffer size');
          void reader.cancel();
          return;
        }
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let currentEventType: string | null = null;
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && currentEventType) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEventType === ChatStreamEventType.DONE) {
                doneSignaled = true;
                onDone();
              } else if (currentEventType === ChatStreamEventType.ERROR) {
                onError(data.message ?? 'Unknown error');
              } else if (isKnownEventType(currentEventType)) {
                onEvent({ type: currentEventType, data });
              }
            } catch {
              // skip malformed SSE data
            }
            currentEventType = null;
          }
        }
      }

      if (!doneSignaled) {
        onDone();
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message ?? 'Network error');
      }
    });

  return controller;
}

const KNOWN_EVENT_TYPES = new Set<string>(Object.values(ChatStreamEventType));

function isKnownEventType(value: string): value is ChatStreamEventType {
  return KNOWN_EVENT_TYPES.has(value);
}

export const chatApi = {
  createConversation,
  listConversations,
  getMessages,
  updateConversation,
  deleteConversation,
  sendMessage,
};
