import { useQueryClient } from '@tanstack/react-query';

import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

type FlagGuardProps = {
  children: React.ReactNode;
  flag: ApFlagId;
};
const FlagGuard = ({ children, flag }: FlagGuardProps) => {
  const queryClient = useQueryClient();
  const flagQuery = flagsHooks.useFlag<boolean>(flag, queryClient);
  if (flagQuery.isLoading || flagQuery.error || !flagQuery.data) {
    return null;
  }
  return children;
};

FlagGuard.displayName = 'FlagGuard';
export { FlagGuard };
