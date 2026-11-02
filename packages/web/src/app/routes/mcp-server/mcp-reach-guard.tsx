import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';

export function McpReachGuard({ children }: { children: ReactNode }) {
  const { isResolved, reachesMcp } = mcpHooks.useMcpReach();

  if (!isResolved) {
    return null;
  }
  if (!reachesMcp) {
    return <Navigate to="/404" replace />;
  }
  return children;
}
