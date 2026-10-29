import { t } from 'i18next';
import React from 'react';

import { adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { DOCS_URL } from './parts';

export function NoGroupsGuide() {
  return (
    <div className={cn(adminSurface.card, 'flex flex-col gap-6 p-5')}>
      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-12">
          {t('You have no worker groups yet')}
        </h2>
        <p className="text-sm text-gray-11">
          {t(
            'Right now every project and flow runs on your shared workers. That is fine for most teams.',
          )}
        </p>
      </section>
      <section className="flex max-w-2xl flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-12">
          {t('When a group helps')}
        </h3>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-gray-11">
          <li>
            {t(
              'A busy project slows the others down. Give it its own servers.',
            )}
          </li>
          <li>
            {t(
              'A few flows need more memory or a GPU. Send just those flows to bigger servers.',
            )}
          </li>
          <li>
            {t(
              'A project must run in one region or network. Keep it on servers there.',
            )}
          </li>
        </ul>
      </section>
      <section className="flex max-w-2xl flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-12">
          {t('How to add one')}
        </h3>
        <SetupSteps />
      </section>
      <div>
        <Button variant="outline" asChild>
          <a
            {...adminControl(AdminControl.WORKERS_DOCS_LINK)}
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t('Read the guide')}
          </a>
        </Button>
      </div>
    </div>
  );
}

function SetupSteps() {
  return (
    <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-gray-11">
      <li>
        {t('Start one or more workers with')}{' '}
        <Code>AP_WORKER_GROUP_ID=finance_eu</Code>
        {t(', using your own group name.')}
      </li>
      <li>
        {t(
          'For a group that runs single flows instead of whole projects, also set',
        )}{' '}
        <Code>AP_WORKER_GROUP_SCOPE=flow</Code>.
      </li>
      <li>
        {t(
          'The group shows up here once a worker is online. Then add projects or flows to it.',
        )}
      </li>
    </ol>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-gray-3 px-1 py-0.5 font-mono text-xs text-gray-12">
      {children}
    </code>
  );
}
