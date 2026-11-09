import { t } from 'i18next';
import { Menu } from 'lucide-react';

import { ChatSparkIcon } from '@/components/icons/chat-spark';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { useChatSheet, useChatWidth } from '../chat-panel/chat-window';

export function MobileSidebarBar() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const branding = flagsHooks.useWebsiteBranding();
  const { platform } = platformHooks.useCurrentPlatform();
  const embedded = useEmbedding().embedState.isEmbedded;
  const chatOn = !embedded && platform.plan.chatEnabled;
  const fullPage = useChatWidth() === 'full';
  const chatSheet = useChatSheet();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2 bg-gray-2 px-2 pt-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md"
        aria-label={t('Open menu')}
        aria-expanded={openMobile}
        onClick={() => setOpenMobile(true)}
      >
        <Menu className="size-4" />
      </Button>
      <img
        src={branding.logos.logoIconUrl}
        alt=""
        className="size-5 shrink-0"
        draggable={false}
      />
      <span className="truncate text-sm font-medium text-gray-12">
        {branding.websiteName}
      </span>
      {chatOn && !fullPage && (
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-8 rounded-md"
          aria-label={t('Chat')}
          onClick={chatSheet.show}
        >
          <ChatSparkIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}
