import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PAGE_SIZE_OPTIONS } from '../lib/utils';

type AutomationsPaginationProps = {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export const AutomationsPagination = ({
  currentPage,
  totalItems,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}: AutomationsPaginationProps) => {
  const maxPages = Math.max(totalPages, 1);

  return (
    <div className="flex items-center justify-between px-2 py-4 text-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t('Rows per page')}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-muted-foreground">
          {t('Page {current} of {total}', {
            current: currentPage + 1,
            total: maxPages,
          })}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevPage}
          disabled={currentPage === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('Previous')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextPage}
          disabled={currentPage >= maxPages - 1}
          className="gap-1"
        >
          {t('Next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
