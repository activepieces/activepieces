import { SearchRemoveIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export const EmptyTemplatesView = () => {
  return (
    <Empty className="min-h-[300px]">
      <EmptyHeader className="max-w-xl">
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={SearchRemoveIcon} />
        </EmptyMedia>
        <EmptyTitle>{t('No templates found')}</EmptyTitle>
        <EmptyDescription>
          {t(
            'No templates match your search criteria. Try adjusting your search terms.',
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
