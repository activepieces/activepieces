import { PlatformCopilotErrorCode } from '@activepieces/shared';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart, UIMessage } from 'ai';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { API_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

export function usePlatformCopilot() {
  const storageKey = `ap-copilot-${
    authenticationSession.getCurrentUserId() ?? 'anon'
  }`;
  const initialMessages = useMemo(() => loadMessages(storageKey), [storageKey]);

  const chat = useChat({
    messages: initialMessages,
    onError: (error) => {
      const message = friendlyErrorMessage(error);
      if (message) toast.error(message);
    },
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

function friendlyErrorMessage(error: Error): string | null {
  const code = parseCopilotErrorCode(error.message);
  switch (code) {
    case PlatformCopilotErrorCode.USER_HOURLY_LIMIT_REACHED:
      return "You're going a bit fast. Try again in an hour.";
    case PlatformCopilotErrorCode.PLATFORM_DAILY_LIMIT_REACHED:
      return "Your platform has reached today's copilot limit. It resets at midnight UTC.";
    case PlatformCopilotErrorCode.SERVICE_PAUSED:
      return "Activepieces copilot is taking a quick break. We'll be back shortly.";
    case PlatformCopilotErrorCode.PLATFORM_UNAVAILABLE:
      return "Activepieces copilot isn't available for your workspace right now. Please contact support.";
    case PlatformCopilotErrorCode.COPILOT_UNREACHABLE:
      return "Can't reach the Activepieces copilot service. Check your network and try again.";
    case PlatformCopilotErrorCode.CONTENT_POLICY:
      return "That message can't be processed. Please rephrase and try again.";
    default:
      return 'Something went wrong sending your message. Please try again.';
  }
}

function parseCopilotErrorCode(message: string): string | null {
  try {
    const parsed = JSON.parse(message) as { error?: unknown };
    return typeof parsed.error === 'string' ? parsed.error : null;
  } catch {
    return null;
  }
}

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY_CONTENT_CHARS = 8000;
const MAX_HISTORY_MESSAGES = 50;
