import { useChatWidth } from './chat-window';
import { FollowBar } from './follow-bar';

export function ChatContentColumn({ children }: { children: React.ReactNode }) {
  const full = useChatWidth() === 'full';
  return (
    <div inert={full} className="min-w-0 flex-1 overflow-hidden">
      <div className="flex h-full flex-col">
        <FollowBar />
        {children}
      </div>
    </div>
  );
}
