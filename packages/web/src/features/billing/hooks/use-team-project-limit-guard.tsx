import { isNil } from '@activepieces/core-utils';
import { ProjectType, ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

export const useTeamProjectLimitGuard = ({
  projects,
}: {
  projects: Pick<ProjectWithLimits, 'type'>[];
}) => {
  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const isPlatformAdmin = useIsPlatformAdmin();
  const { platform } = platformHooks.useCurrentPlatform();
  const { openDialog } = useManagePlanDialogStore();

  const limit = platform.plan.billedTeamProjectsLimit;
  const teamProjectsUsed = projects.filter(
    (project) => project.type === ProjectType.TEAM,
  ).length;
  const hasReachedLimit = !isNil(limit) && teamProjectsUsed >= limit;

  const ensureTeamProjectAvailable = (): boolean => {
    if (!hasReachedLimit) {
      return true;
    }
    setIsLimitOpen(true);
    return false;
  };

  const teamProjectLimitDialog = (
    <TeamProjectLimitDialog
      open={isLimitOpen}
      onOpenChange={setIsLimitOpen}
      limit={limit ?? 0}
      isPlatformAdmin={isPlatformAdmin}
      onExplorePlans={() => {
        setIsLimitOpen(false);
        openDialog();
      }}
    />
  );

  return {
    hasReachedLimit,
    ensureTeamProjectAvailable,
    teamProjectLimitDialog,
  };
};

function TeamProjectLimitDialog({
  open,
  onOpenChange,
  limit,
  isPlatformAdmin,
  onExplorePlans,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limit: number;
  isPlatformAdmin: boolean;
  onExplorePlans: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {t("You've reached your team project limit")}
          </DialogTitle>
          <DialogDescription>
            {isPlatformAdmin
              ? limit === 0
                ? t(
                    'Team projects let you group flows and share them with your teammates. Upgrade to add one.',
                  )
                : t(
                    'Your plan includes {count, plural, =1 {1 team project} other {# team projects}}. Upgrade to add more.',
                    { count: limit },
                  )
              : t(
                  'Contact a platform admin to upgrade the plan and add more team projects.',
                )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {isPlatformAdmin ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="button" onClick={onExplorePlans}>
                {t('Explore plans')}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>
              {t('Got it')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
