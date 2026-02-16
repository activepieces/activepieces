import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { ROOT_PAGE_SIZE } from '../lib/utils';

type AutomationsPaginationProps = {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export const AutomationsPagination = ({
  currentPage,
  totalItems,
  totalPages,
  onPrevPage,
  onNextPage,
}: AutomationsPaginationProps) => {
  const start = totalItems === 0 ? 0 : currentPage * ROOT_PAGE_SIZE + 1;
  const end = Math.min((currentPage + 1) * ROOT_PAGE_SIZE, totalItems);
  const maxPages = Math.max(totalPages, 1);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        {t('Showing {start} to {end} of {total} items', {
          start,
          end,
          total: totalItems,
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          {t('Page {current} of {total}', {
            current: currentPage + 1,
            total: maxPages,
          })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={currentPage >= maxPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
