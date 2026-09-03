import { t } from 'i18next';

import { Button } from '@/components/ui/button';

import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { ActivityFeed } from './activity-feed';

export function ActivityTab() {
  const nav = useMcpNav();

  return (
    <PageBand className="flex flex-col gap-2 py-8">
      <ActivityFeed
        emptyStateAction={
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => nav.showTab('connections')}
          >
            {t('See who is connected')} →
          </Button>
        }
      />
    </PageBand>
  );
}
