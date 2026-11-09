import { t } from 'i18next';
import { X } from 'lucide-react';

import { ChatSparkIcon } from '@/components/icons/chat-spark';
import { Button } from '@/components/ui/button';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';

export function FollowOfferRow({
  conversationId,
}: {
  conversationId: string | null;
}) {
  const offer = useFollowAlong((s) => s.offer);
  if (!offer || offer.conversationId !== conversationId) return null;

  const open = () => {
    followAlong.dismissOffer();
    chatPanelUtils.openBeside({
      route: resourceRegistry.route(offer.resource),
      push: true,
      name: offer.resource.name,
    });
  };

  return (
    <div
      role="status"
      className="flex items-center gap-2 py-2 text-sm text-gray-11 animate-in fade-in duration-150 ease-move motion-reduce:animate-none"
    >
      <ChatSparkIcon className="size-4 shrink-0 text-accent-11" />
      <span className="min-w-0 flex-1">
        {t('The AI changed {name}. Open it beside the chat?', {
          name: offer.resource.name,
        })}
      </span>
      <Button variant="outline" size="xs" onClick={open}>
        {t('Open')}
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={t('Dismiss')}
        onClick={followAlong.dismissOffer}
        className="text-gray-11"
      >
        <X />
      </Button>
    </div>
  );
}
