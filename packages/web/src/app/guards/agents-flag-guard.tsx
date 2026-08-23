import { ApFlagId } from '@activepieces/shared';
import { Navigate } from 'react-router-dom';

import { flagsHooks } from '@/hooks/flags-hooks';

type AgentsFlagGuardProps = {
  children: React.ReactNode;
};

export const AgentsFlagGuard = ({ children }: AgentsFlagGuardProps) => {
  const { data: agentsEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.AGENTS_ENABLED,
  );
  if (agentsEnabled !== true) {
    return <Navigate to="/flows" replace />;
  }
  return children;
};
