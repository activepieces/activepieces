import { PlatformAdminSurface } from '@activepieces/shared';
import { t } from 'i18next';
import { Gem, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

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
import { useOpenSales } from '@/features/billing';
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
  const openSales = useOpenSales({
    featureKey: 'DEDICATED_WORKERS',
    surface: PlatformAdminSurface.SAMPLE,
  });

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
              {reason === 'cloud' ? (
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
            <LockAction
              action={copy.secondary}
              variant="outline"
              openSales={openSales}
            />
            <LockAction
              action={copy.primary}
              variant="default"
              openSales={openSales}
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

function LockAction({
  action,
  variant,
  openSales,
}: {
  action: LockActionCopy;
  variant: 'default' | 'outline';
  openSales: () => void;
}) {
  if ('href' in action) {
    return (
      <Button variant={variant} asChild>
        <a
          {...adminControl(AdminControl.PLAN_SAMPLE_LINK)}
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {action.label}
        </a>
      </Button>
    );
  }
  if ('to' in action) {
    return (
      <Button variant={variant} asChild>
        <Link {...adminControl(AdminControl.PLAN_SAMPLE_LINK)} to={action.to}>
          {action.label}
        </Link>
      </Button>
    );
  }
  return (
    <Button variant={variant} onClick={openSales}>
      {action.label}
    </Button>
  );
}

function lockCopy(reason: WorkerGroupsLockReason): LockCopy {
  const setupGuide = { label: t('Setup guide'), href: DOCS_URL };
  const talkToSales = { label: t('Talk to sales') };
  switch (reason) {
    case 'cloud':
      return {
        title: t('Worker groups run on your own servers'),
        description: t(
          'Available on self-hosted Activepieces. Talk to sales to set it up.',
        ),
        secondary: setupGuide,
        primary: talkToSales,
      };
    case 'community':
      return {
        title: t('Worker groups need the Enterprise edition'),
        description: t(
          'Switch your Activepieces to the Enterprise edition to use them.',
        ),
        secondary: {
          label: t('How to switch'),
          href: adminDocs.url(
            'install/configure-operate/enterprise-license#billing-page-not-showing',
          ),
        },
        primary: talkToSales,
      };
    case 'no-license':
      return {
        title: t('Add your license key to use worker groups'),
        description: t(
          'Worker groups come with an Enterprise license. Add yours in Billing.',
        ),
        secondary: talkToSales,
        primary: { label: t('Add license key'), to: '/platform/billing' },
      };
    case 'not-in-license':
      return {
        title: t('Your license doesn’t include worker groups'),
        description: t(
          'Ask us to add them to your license, then follow the setup guide to start your first group.',
        ),
        secondary: setupGuide,
        primary: talkToSales,
      };
  }
}

type LockActionCopy =
  | { label: string; href: string }
  | { label: string; to: string }
  | { label: string };

type LockCopy = {
  title: string;
  description: string;
  secondary: LockActionCopy;
  primary: LockActionCopy;
};
