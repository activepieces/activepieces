import { t } from 'i18next';
import { Bug } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';
//TODO: remove after release
export const ReportBugsButton = ({
  variant,
}: {
  variant: 'outline' | 'ghost';
}) => {
  const reportBugsUrl = `https://community.activepieces.com/t/new-ui-open-beta-testing/5743?u=abdul`;
  const { data: showSupport } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  return (
    showSupport && (
      <Button
        size="sm"
        variant={variant}
        onClick={() =>
          window.open(reportBugsUrl, '_blank', 'noopener noreferrer')
        }
      >
        <div className="flex gap-2 items-center">
          <Bug className="w-4 h-4"></Bug>
          {t('Report Bugs')}
        </div>
      </Button>
    )
  );
};
