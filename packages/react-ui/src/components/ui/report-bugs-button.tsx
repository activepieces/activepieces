import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { t } from 'i18next';
import { Bug } from 'lucide-react';
import { ApFlagId } from '../../../../shared/src';
import { useQueryClient } from '@tanstack/react-query';
//TODO: remove after release
export const ReportBugsButton = ({
  variant,
}: {
  variant: 'outline' | 'ghost';
}) => {
  const reportBugsUrl = `https://community.activepieces.com/t/new-ui-open-beta-testing/5743?u=abdul`;
  const showSupport = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
    useQueryClient(),
  );
  return (
    showSupport && (
      <Button
        variant={variant}
        onClick={() =>
          window.open(reportBugsUrl, '_blank', 'noopener noreferrer')
        }
      >
        <div className="flex gap-2 items-center">
          <Bug className="w-6 h-6"></Bug>
          {t('Report Bugs')}
        </div>
      </Button>
    )
  );
};
