import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart, UIMessage } from 'ai';
import { useEffect, useMemo } from 'react';

import { API_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

export function usePlatformCopilot() {
  const storageKey = `ap-copilot-${
    authenticationSession.getCurrentUserId() ?? 'anon'
  }`;
  const initialMessages = useMemo(() => loadMessages(storageKey), [storageKey]);

  const chat = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${API_URL}/v1/platform-copilot/chat`,
      headers: () => ({
        Authorization: `Bearer ${authenticationSession.getToken() ?? ''}`,
      }),
      prepareSendMessagesRequest: ({ messages }) => {
        const lastMessage = messages[messages.length - 1];
        const conversationHistory = messages
          .slice(0, -1)
          .slice(-MAX_HISTORY_MESSAGES)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: getMessageText(m).slice(0, MAX_HISTORY_CONTENT_CHARS),
          }));
        return {
          body: {
            message: getMessageText(lastMessage).slice(0, MAX_MESSAGE_CHARS),
            conversationHistory,
          },
        };
      },
    }),
  });

  useEffect(() => {
    saveMessages(storageKey, chat.messages);
  }, [storageKey, chat.messages]);

  const clearChat = () => {
    chat.setMessages([]);
    localStorage.removeItem(storageKey);
  };

  return { ...chat, clearChat };
}

function getMessageText(m: UIMessage | undefined): string {
  if (!m) return '';
  return m.parts.find(isTextUIPart)?.text ?? '';
}

function loadMessages(key: string): UIMessage[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidMessage) as UIMessage[];
  } catch {
    return [];
  }
}

function saveMessages(key: string, messages: UIMessage[]): void {
  try {
    if (messages.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    const serializable = messages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: m.parts.filter((p) => p.type === 'text'),
    }));
    localStorage.setItem(key, JSON.stringify(serializable));
  } catch {
    /* storage full or unavailable */
  }
}

function isValidMessage(item: unknown): boolean {
  if (!item || typeof item !== 'object') return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record['id'] === 'string' &&
    typeof record['role'] === 'string' &&
    Array.isArray(record['parts'])
  );
}

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY_CONTENT_CHARS = 8000;
const MAX_HISTORY_MESSAGES = 50;
