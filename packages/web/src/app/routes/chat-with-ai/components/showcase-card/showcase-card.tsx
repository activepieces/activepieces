import { Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  ChatCard,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from '../chat-ui/chat-card';

import {
  ShowcaseLayout,
  ShowcaseTile,
  ShowcaseTileData,
} from './showcase-tile';

const MAX_TILES = 4;
const MAX_LIST_TILES = 3;

export function ShowcaseCard({
  content,
  onSendPrompt,
  streaming = false,
}: {
  content: ShowcaseContent;
  onSendPrompt?: (text: string) => void;
  streaming?: boolean;
}) {
  const tiles = (Array.isArray(content?.tiles) ? content.tiles : []).slice(
    0,
    MAX_TILES,
  );
  if (!streaming && tiles.length === 0) {
    return null;
  }

  const isGrid = content.layout === 'grid' && tiles.length > MAX_LIST_TILES;

  return (
    <ChatCard>
      <ChatCardHeader
        tile={<ChatCardTile kind="bits" icon={Sparkles} />}
        title={content.headline}
        meta={content.subhead}
      />
      <ChatCardBody
        className={cn(
          isGrid
            ? 'grid grid-cols-2 gap-2 @max-chat-narrow/chat:grid-cols-1'
            : 'gap-1',
        )}
      >
        {tiles.map((tile, i) => (
          <ShowcaseTile
            key={i}
            tile={tile}
            framed={isGrid}
            streaming={streaming}
            onSendPrompt={onSendPrompt}
          />
        ))}
        {streaming && tiles.length === 0 && (
          <div className="flex w-full animate-pulse items-center gap-3 px-2 py-2">
            <div className="size-8 shrink-0 rounded-md bg-gray-3" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded-md bg-gray-3" />
              <div className="h-3 w-3/5 rounded-md bg-gray-3" />
            </div>
          </div>
        )}
      </ChatCardBody>
    </ChatCard>
  );
}

export type ShowcaseContent = {
  headline: string;
  subhead?: string;
  layout?: ShowcaseLayout;
  tiles: ShowcaseTileData[];
};
