import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useMcpNav } from '../mcp-nav';

import { ActivityFeed } from './activity-feed';

export function ActivityTab() {
  const nav = useMcpNav();

  return (
    <ActivityFeed
      emptyStateAction={
        <Button variant="outline" onClick={() => nav.showTab('connections')}>
          {t('See who is connected')}
          <ArrowRight />
        </Button>
      }
    />
  );
}
