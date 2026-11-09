import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

export function FollowOfferRow() {
  const offer = useFollowAlong((s) => s.offer);
  const conversationId = useChatPanel((s) => s.conversationId);
  if (!offer || offer.conversationId !== conversationId) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 px-1 text-sm text-gray-11"
    >
      <span className="min-w-0 flex-1">
        {t('The AI is editing {name}.', { name: offer.resource.name })}
      </span>
      <Button variant="outline" size="xs" onClick={followAlong.acceptOffer}>
        {t('Open beside')}
      </Button>
      <Button variant="ghost" size="xs" onClick={followAlong.stopFollowing}>
        {t('Stay here')}
      </Button>
    </div>
  );
}
