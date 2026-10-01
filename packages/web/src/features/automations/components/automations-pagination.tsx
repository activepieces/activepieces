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
  totalPages: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export const AutomationsPagination = ({
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}: AutomationsPaginationProps) => {
  const maxPages = Math.max(totalPages, 1);

  return (
    <div className="flex items-center justify-end gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-11">{t('Rows per page')}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
        >
          <SelectTrigger size="sm" className="w-[70px]">
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
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevPage}
        disabled={currentPage === 0}
      >
        <ChevronLeft />
        {t('Previous')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNextPage}
        disabled={currentPage >= maxPages - 1}
      >
        {t('Next')}
        <ChevronRight />
      </Button>
    </div>
  );
};
