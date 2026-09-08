import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (total <= pageSize) {
    return null;
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className="text-xs text-muted-foreground tabular-nums">
        {t('Showing {from}–{to} of {total}', {
          from: page * pageSize + 1,
          to: Math.min((page + 1) * pageSize, total),
          total,
        })}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground tabular-nums">
          {t('Page {page} of {pages}', {
            page: page + 1,
            pages: pageCount,
          })}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function pageSlice<T>({
  items,
  page,
  pageSize,
}: {
  items: T[];
  page: number;
  pageSize: number;
}): { rows: T[]; page: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  return {
    rows: items.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    page: currentPage,
  };
}
