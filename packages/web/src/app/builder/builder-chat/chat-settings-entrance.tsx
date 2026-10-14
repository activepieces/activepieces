import { useState } from 'react';

import { cn } from '@/lib/utils';

export function ChatSettingsEntrance({
  entrance,
  children,
}: {
  entrance: ChatSettingsEntranceKind;
  children: React.ReactNode;
}) {
  const [entranceAtMount] = useState(entrance);
  return (
    <div
      className={cn('h-full', {
        'animate-in fade-in slide-in-from-right-8 duration-700 ease-out fill-mode-both':
          entranceAtMount === 'arrive',
        'chat-settings-flash': entranceAtMount === 'refresh',
      })}
    >
      {children}
    </div>
  );
}

export type ChatSettingsEntranceKind = 'arrive' | 'refresh' | 'none';
