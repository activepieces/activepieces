import { FollowBar } from './follow-bar';

// The page column next to the docked chat. It reflows with the panel as it
// opens, so the page eases aside instead of jumping to its final width.
// While the chat edits the page's resource, a quiet bar sits on top.
export function ChatContentColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 overflow-hidden">
      <div className="flex h-full flex-col">
        <FollowBar />
        {children}
      </div>
    </div>
  );
}
