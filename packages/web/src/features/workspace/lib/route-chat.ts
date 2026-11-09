import { isObject } from '@activepieces/core-utils';
import { useMatches } from 'react-router-dom';

export function useRouteChat(): RouteChat {
  const match = useMatches().findLast((m) => isShellHandle(m.handle));
  return chatOfHandle(match?.handle);
}

function chatOfHandle(handle: unknown): RouteChat {
  if (!isObject(handle)) return DEFAULT_ROUTE_CHAT;
  const chat = handle.chat;
  return chat === 'none' || chat === 'dock' || chat === 'full'
    ? chat
    : DEFAULT_ROUTE_CHAT;
}

function isShellHandle(handle: unknown): boolean {
  return isObject(handle) && 'shell' in handle;
}

const DEFAULT_ROUTE_CHAT: RouteChat = 'dock';

export const routeChatUtils = { chatOfHandle };

export type RouteChat = 'none' | 'dock' | 'full';
