import { t } from 'i18next';
import { ListTodo } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PlanItem as PlanItemType } from '@activepieces/shared';

import { PlanItem } from './plan-item';

export interface PlanItemData {
  text: string;
  status: PlanItemType['status'];
}

export interface PlanProps {
  items: PlanItemType[];
  className?: string;
}

export function Plan({ items, className }: PlanProps) {
  const hasItems = items && items.length > 0;
  const hasIncompleteItems =
    hasItems && items.some((item) => item.status !== 'completed');

  return (
    <div className={cn('rounded-lg border bg-background', className)}>
      <div className="flex items-center gap-2 text-foreground pb-3 border-b px-4 pt-4">
        {hasIncompleteItems ? (
          <img
            src="https://cdn.activepieces.com/quicknew/cooking.gif"
            alt=""
            className="size-6"
          />
        ) : (
          <ListTodo className="size-5" />
        )}
        <span className="font-medium text-base">{t('Plan')}</span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {hasItems ? (
          items.map((item, index) => (
            <PlanItem key={index} text={item.content} status={item.status} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t(
                'Quick will break down complex tasks into steps and track progress here',
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
