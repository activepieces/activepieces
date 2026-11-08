import { ReactNode } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

export function ChatKeyValue({ rows, className }: ChatKeyValueProps) {
  return (
    <dl
      className={cn(
        'flex min-w-0 flex-col divide-y divide-gray-4 rounded-lg border border-gray-5',
        className,
      )}
    >
      {rows.map((row, index) => (
        <div
          key={`${index}-${row.label}`}
          className="flex min-w-0 gap-3 px-3 py-2 @max-chat-narrow/chat:flex-col @max-chat-narrow/chat:gap-0.5"
        >
          <TextWithTooltip tooltipMessage={row.label}>
            <dt className="w-28 shrink-0 truncate text-xs leading-5 text-gray-11 @max-chat-narrow/chat:w-auto">
              {row.label}
            </dt>
          </TextWithTooltip>
          <dd className="min-w-0 flex-1 break-words text-sm text-gray-12">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type ChatKeyValueProps = {
  rows: ChatKeyValueRow[];
  className?: string;
};

type ChatKeyValueRow = {
  label: string;
  value: ReactNode;
};
