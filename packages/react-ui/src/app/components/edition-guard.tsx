import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

type EditionGuardProps = {
  children: React.ReactNode;
  allowedEditions: ApEdition[];
};

const EditionGuard = ({ children, allowedEditions }: EditionGuardProps) => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (!edition || !allowedEditions.includes(edition)) {
    return null;
  }
  return children;
};

EditionGuard.displayName = 'EditionGuard';
export { EditionGuard };
