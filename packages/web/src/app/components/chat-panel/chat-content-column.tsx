import { pageColumnUtils } from '@/lib/page-column-utils';

import { useChatWidth } from './chat-window';

export function ChatContentColumn({ children }: { children: React.ReactNode }) {
  const full = useChatWidth() === 'full';
  return (
    <div
      id={pageColumnUtils.ID}
      inert={full}
      className="relative isolate flex min-w-0 flex-1 flex-col overflow-hidden"
    >
      {children}
    </div>
  );
}
