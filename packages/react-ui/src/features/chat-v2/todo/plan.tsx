import { t } from 'i18next';
import React from 'react';

import { cn } from '@/lib/utils';

import { PlanItem, PlanItemStatus } from './plan-item';

export interface PlanItemData {
  text: string;
  status: PlanItemStatus;
}

export interface PlanProps {
  items: PlanItemData[];
  className?: string;
}

export function Plan({ items, className }: PlanProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const hasIncompleteItems = items.some((item) => item.status !== 'completed');

  return (
    <div className={cn('rounded-lg border bg-background', className)}>
      <div className="flex items-center gap-2 text-foreground pb-3 border-b px-4 pt-4">
        <img
          src={
            hasIncompleteItems
              ? 'https://cdn.activepieces.com/quicknew/cooking.gif'
              : 'https://cdn.activepieces.com/quicknew/cooking-static.svg'
          }
          alt=""
          className="size-8"
        />
        <span className="font-normal text-base">
          {hasIncompleteItems ? t('Working on it') : t('Completed the plan')}
        </span>
      </div>
      <div className="flex flex-col gap-2 bg-accent p-4">
        {items.map((item, index) => (
          <PlanItem key={index} text={item.text} status={item.status} />
        ))}
      </div>
    </div>
  );
}
