import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { getPaginationInfo, ROOT_PAGE_SIZE } from '../lib/utils';

type AutomationsPaginationProps = {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export const AutomationsPagination = ({
  currentPage,
  totalItems,
  onPageChange,
}: AutomationsPaginationProps) => {
  const { totalPages, start, end, hasPreviousPage, hasNextPage } =
    getPaginationInfo(currentPage, ROOT_PAGE_SIZE, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        {t('Showing {{start}} to {{end}} of {{total}} items', {
          start,
          end,
          total: totalItems,
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          {t('Page {{current}} of {{total}}', {
            current: currentPage + 1,
            total: totalPages,
          })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onPageChange(Math.min(totalPages - 1, currentPage + 1))
          }
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
