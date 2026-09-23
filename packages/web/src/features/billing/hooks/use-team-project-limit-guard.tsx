import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, LayoutGrid } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { RequestTrial } from '../components/request-trial';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';
import { TIER_LABELS } from '../utils/feature-tier';
import { PLATFORM_FEATURES } from '../utils/platform-features';

export const useTeamProjectLimitGuard = ({
  projects,
}: {
  projects: Pick<ProjectWithLimits, 'type'>[];
}) => {
  const isPlatformAdmin = useIsPlatformAdmin();
  const { platform } = platformHooks.useCurrentPlatform();
  const { openDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const limit = platform.plan.billedTeamProjectsLimit;
  const teamProjectsUsed = projects.filter(
    (project) => project.type === ProjectType.TEAM,
  ).length;
  const hasReachedLimit = !isNil(limit) && teamProjectsUsed >= limit;

  const teamProjectLimitContent = ({ onClose }: { onClose: () => void }) => (
    <TeamProjectLimitContent
      limit={limit ?? 0}
      isPlatformAdmin={isPlatformAdmin}
      isCommunity={edition === ApEdition.COMMUNITY}
      onClose={onClose}
      onExplorePlans={() => {
        onClose();
        openDialog();
      }}
    />
  );

  return {
    hasReachedLimit,
    teamProjectLimitContent,
  };
};

function TeamProjectLimitContent({
  limit,
  isPlatformAdmin,
  isCommunity,
  onClose,
  onExplorePlans,
}: TeamProjectLimitContentProps) {
  const feature = PLATFORM_FEATURES.projects;
  const isFirstTeamProject = limit === 0;
  const showBenefits = isPlatformAdmin && isFirstTeamProject;

  return (
    <>
      <DialogHeader>
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <LayoutGrid className="size-5 text-primary-ink" />
        </div>
        <DialogTitle className="flex items-center gap-2">
          {showBenefits
            ? t(feature.title)
            : t("You've reached your team project limit")}
          {showBenefits && (
            <Badge variant="outline">{TIER_LABELS[feature.tier]}</Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          {isPlatformAdmin
            ? isFirstTeamProject
              ? t(feature.description)
              : t(
                  'Your plan includes {count, plural, =1 {1 team project} other {# team projects}}. Upgrade to add more.',
                  { count: limit },
                )
            : t(
                'Contact a platform admin to upgrade the plan and add more team projects.',
              )}
        </DialogDescription>
      </DialogHeader>
      {showBenefits && (
        <ul className="flex flex-col gap-2">
          {feature.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary-ink" />
              <span>{t(bullet)}</span>
            </li>
          ))}
        </ul>
      )}
      <DialogFooter>
        {isPlatformAdmin ? (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
            {isCommunity ? (
              <RequestTrial featureKey={feature.featureKey} />
            ) : (
              <Button type="button" onClick={onExplorePlans}>
                {t('Explore plans')}
              </Button>
            )}
          </>
        ) : (
          <Button type="button" onClick={onClose}>
            {t('Got it')}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

type TeamProjectLimitContentProps = {
  limit: number;
  isPlatformAdmin: boolean;
  isCommunity: boolean;
  onClose: () => void;
  onExplorePlans: () => void;
};
