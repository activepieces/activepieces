import { Navigate } from 'react-router-dom';

import { useAgentsEnabled } from '@/features/agents';

type AgentsFlagGuardProps = {
  children: React.ReactNode;
};

export const AgentsFlagGuard = ({ children }: AgentsFlagGuardProps) => {
  const agentsEnabled = useAgentsEnabled();
  if (!agentsEnabled) {
    return <Navigate to="/flows" replace />;
  }
  return children;
};
