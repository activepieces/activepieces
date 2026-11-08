import { ImageGeneratedEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { Download, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  ChatCard,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatImage } from './chat-ui/chat-image';

export function GeneratedImageCard({
  image,
  doneTitle,
  flat,
}: GeneratedImageCardProps) {
  const caption = image.caption ?? image.prompt ?? t('Generated image');
  const title = doneTitle ?? caption;

  return (
    <ChatCard flat={flat} className="max-w-md">
      <ChatCardHeader
        tile={<ChatCardTile kind="bits" icon={ImageIcon} />}
        title={title}
        meta={title === caption ? undefined : caption}
        trailing={
          <Button
            asChild
            variant="ghost"
            size="icon-xs"
            className="text-gray-11"
          >
            <a
              href={image.url}
              download
              target="_blank"
              rel="noreferrer"
              aria-label={t('Download')}
            >
              <Download className="size-4" />
            </a>
          </Button>
        }
      />
      <ChatCardBody>
        <ChatImage src={image.url} alt={caption} />
      </ChatCardBody>
    </ChatCard>
  );
}

type GeneratedImageCardProps = {
  image: ImageGeneratedEvent;
  doneTitle?: string;
  flat?: boolean;
};
