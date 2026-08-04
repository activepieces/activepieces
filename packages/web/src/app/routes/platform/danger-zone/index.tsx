import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Navigate } from 'react-router-dom';

import { CenteredPage } from '@/app/components/centered-page';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { billingUtils } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { DeletePlatformCard } from './delete-platform-card';

export default function DangerZonePage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: user } = userHooks.useCurrentUser();

  const isOwner = platform.ownerId === user?.id;
  if (edition !== ApEdition.CLOUD || !isOwner) {
    return <Navigate to="/platform/projects" replace />;
  }

  return (
    <CenteredPage
      title={t('Danger Zone')}
      description={t('Irreversible actions that affect your whole platform.')}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{t('Delete Platform')}</h2>
          <div className="text-sm text-muted-foreground">
            {t(
              'Close this platform for everyone on it. Members lose access immediately and the data is erased a week later.',
            )}
          </div>
        </div>
        {billingUtils.isPaidPlan(platform.plan.plan) ? (
          <Alert variant="warning">
            <AlertDescription>
              {t('Cancel your subscription before deleting this platform.')}
            </AlertDescription>
          </Alert>
        ) : (
          <DeletePlatformCard platformName={platform.name} />
        )}
      </div>
    </CenteredPage>
  );
}
