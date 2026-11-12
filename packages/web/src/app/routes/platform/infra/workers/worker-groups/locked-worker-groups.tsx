import { SalesLinkLocationInWebApp } from '@activepieces/shared';
import { t } from 'i18next';
import { Gem, Server } from 'lucide-react';

import {
  AdminPage,
  AdminPageHeader,
  adminDocs,
  adminPageResources,
  adminSurface,
} from '@/app/components/admin';
import { sampleData } from '@/app/routes/platform/sample-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SelfServeTrialSalesLink } from '@/features/billing';
import { WorkerGroupsLockReason } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { GroupCards } from './group-cards';
import { DOCS_URL, SearchBox, modelSentence } from './parts';

export function LockedWorkerGroups({
  reason,
}: {
  reason: WorkerGroupsLockReason;
}) {
  const copy = lockCopy(reason);

  return (
    <AdminPage className="max-w-6xl">
      <AdminPageHeader
        title={t('Worker groups')}
        description={modelSentence()}
        resources={adminPageResources.workerGroups}
      />
      <div className={cn(adminSurface.card, '@container shrink-0 p-5')}>
        <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-base font-semibold tracking-tight text-gray-12">
                {copy.title}
              </h2>
              {reason === WorkerGroupsLockReason.CLOUD ? (
                <Badge variant="secondary">
                  <Server />
                  {t('Self-hosted')}
                </Badge>
              ) : (
                <Badge variant="info">
                  <Gem />
                  {t('Enterprise plan')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-11">{copy.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <a
                {...adminControl(AdminControl.WORKERS_DOCS_LINK)}
                href={copy.guide.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.guide.label}
              </a>
            </Button>
            <SelfServeTrialSalesLink
              locationInWebApp={SalesLinkLocationInWebApp.LOCKED_FEATURE}
              variant="default"
              featureKey="DEDICATED_WORKERS"
            />
          </div>
        </div>
      </div>
      <div
        inert
        className="flex flex-col gap-6 opacity-50 grayscale mask-b-from-40%"
      >
        <SearchBox
          value=""
          onChange={() => undefined}
          placeholder={t('Where does a project or flow run?')}
        />
        <GroupCards
          overview={sampleData.workerGroupsOverview()}
          onOpen={() => undefined}
          onAdd={() => undefined}
        />
      </div>
    </AdminPage>
  );
}

function lockCopy(reason: WorkerGroupsLockReason): LockCopy {
  const setupGuide = { label: t('Setup guide'), href: DOCS_URL };
  switch (reason) {
    case WorkerGroupsLockReason.CLOUD:
      return {
        title: t('Worker groups run on your own servers'),
        description: t(
          'Available on self-hosted Activepieces. Talk to sales to set it up.',
        ),
        guide: setupGuide,
      };
    case WorkerGroupsLockReason.COMMUNITY:
      return {
        title: t('Worker groups need the Enterprise edition'),
        description: t(
          'Switch your Activepieces to the Enterprise edition to use them.',
        ),
        guide: {
          label: t('How to switch'),
          href: adminDocs.url(
            'install/configure-operate/enterprise-license#billing-page-not-showing',
          ),
        },
      };
    case WorkerGroupsLockReason.NOT_IN_PLAN:
      return {
        title: t('Your plan doesn’t include worker groups'),
        description: t(
          'Talk to sales to add them to your plan, then follow the setup guide to start your first group.',
        ),
        guide: setupGuide,
      };
  }
}

type LockCopy = {
  title: string;
  description: string;
  guide: { label: string; href: string };
};
