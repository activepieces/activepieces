import { t } from 'i18next';
import { Menu } from 'lucide-react';

import { Dot } from '@/components/custom/dot';
import { ChatSparkIcon } from '@/components/icons/chat-spark';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { useChatOn } from '@/features/workspace/lib/use-chat-on';
import { flagsHooks } from '@/hooks/flags-hooks';

import { useChatSheet, useChatWidth } from '../chat-panel/chat-window';

export function MobileSidebarBar() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const branding = flagsHooks.useWebsiteBranding();
  const chatOn = useChatOn();
  const fullPage = useChatWidth() === 'full';
  const chatSheet = useChatSheet();
  const needsYou = useChatPanel((s) => s.gateOpen);

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
          className="relative ml-auto size-8 rounded-md"
          aria-label={
            needsYou ? t('Chat is waiting for your answer') : t('Chat')
          }
          onClick={chatSheet.show}
        >
          <ChatSparkIcon className="size-4" />
          {needsYou && (
            <Dot
              aria-hidden
              className="absolute top-1 right-1 border-2 border-gray-2 bg-accent-9"
            />
          )}
        </Button>
      )}
    </div>
  );
}
