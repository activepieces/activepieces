import { useQueryClient } from '@tanstack/react-query';

import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

type EditionGuardProps = {
  children: React.ReactNode;
  allowedEditions: ApEdition[];
};

const EditionGuard = ({ children, allowedEditions }: EditionGuardProps) => {
  const queryClient = useQueryClient();
  const editionQuery = flagsHooks.useFlag<ApEdition>(
    ApFlagId.EDITION,
    queryClient,
  );
  if (editionQuery.isLoading || editionQuery.error || !editionQuery.data) {
    return null;
  }
  if (!allowedEditions.includes(editionQuery.data)) {
    return null;
  }
  return children;
};

EditionGuard.displayName = 'EditionGuard';
export { EditionGuard };
