import { SearchRemoveIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Page } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function AdminNotFound() {
  return (
    <Page>
      <Empty className="rounded-2xl bg-panel shadow-edge">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={SearchRemoveIcon} />
          </EmptyMedia>
          <EmptyTitle>{t('There is no admin page here')}</EmptyTitle>
          <EmptyDescription>
            {t('The link may be old or mistyped. Pick a page from the menu.')}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link to="/platform/projects">{t('Go to Projects')}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </Page>
  );
}
