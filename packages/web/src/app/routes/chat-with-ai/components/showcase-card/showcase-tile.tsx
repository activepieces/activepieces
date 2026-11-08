import { cn } from '@/lib/utils';

import { ChatOption } from '../chat-ui/chat-option';
import { OptionIcon } from '../question-inputs/question-icon';

export function ShowcaseTile({
  tile,
  framed,
  streaming = false,
  onSendPrompt,
}: {
  tile: ShowcaseTileData;
  framed: boolean;
  streaming?: boolean;
  onSendPrompt?: (text: string) => void;
}) {
  if (tile == null || typeof tile !== 'object') {
    return null;
  }
  const clickable = Boolean(tile.title) && Boolean(onSendPrompt);
  const iconPending = streaming && !tile.app && !tile.icon;

  return (
    <div className={cn(framed && 'rounded-lg ring-1 ring-inset ring-gray-6')}>
      <ChatOption
        mode="action"
        label={tile.title}
        description={tile.description}
        disabled={!clickable}
        leading={
          iconPending ? (
            <span className="size-8 shrink-0 animate-pulse rounded-md bg-gray-3" />
          ) : (
            <OptionIcon
              piece={tile.app}
              icon={tile.icon ?? 'sparkles'}
              variant="list"
            />
          )
        }
        onPick={() => onSendPrompt?.(tile.title)}
      />
    </div>
  );
}

export type ShowcaseLayout = 'grid' | 'list';

export type ShowcaseTileData = {
  title: string;
  description: string;
  app?: string;
  icon?: string;
};
