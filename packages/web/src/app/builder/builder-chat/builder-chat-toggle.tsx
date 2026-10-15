import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import coachmarkImage from '@/assets/img/custom/builder-chat/coachmark.png';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useBuilderStateContext } from '../builder-hooks';

export function BuilderChatToggle() {
  const [isBuilderChatOpen, isCoachmarkVisible, dismissCoachmark] =
    useBuilderStateContext((state) => [
      state.isBuilderChatOpen,
      state.isChatCoachmarkVisible,
      state.dismissChatCoachmark,
    ]);
  const toggleBuilderChat = useBuilderStateContext(
    (state) => state.setBuilderChatOpen,
  );
  const prefersReducedMotion = useReducedMotion();
  const shouldPulse = !isBuilderChatOpen && !prefersReducedMotion;

  return (
    <Popover
      open={isCoachmarkVisible}
      onOpenChange={(open) => !open && dismissCoachmark()}
    >
      <Tooltip>
        <PopoverAnchor asChild>
          <TooltipTrigger asChild>
            <Button
              variant={isBuilderChatOpen ? 'secondary' : 'ghost'}
              size="icon"
              aria-label={t('AI Assistant')}
              onClick={() => {
                dismissCoachmark();
                toggleBuilderChat(!isBuilderChatOpen);
              }}
            >
              <svg className="absolute size-0" aria-hidden="true">
                <defs>
                  <linearGradient
                    id="builder-chat-sparkles-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#fda4af" />
                  </linearGradient>
                </defs>
              </svg>
              <motion.span
                className="flex"
                animate={
                  shouldPulse
                    ? {
                        filter: [
                          'drop-shadow(0 0 0px rgba(168, 85, 247, 0))',
                          'drop-shadow(0 0 14px rgba(168, 85, 247, 0.9))',
                          'drop-shadow(0 0 0px rgba(168, 85, 247, 0))',
                        ],
                        scale: [1, 1.3, 1],
                      }
                    : { filter: 'none', scale: 1 }
                }
                transition={
                  shouldPulse
                    ? {
                        duration: 0.6,
                        repeat: Infinity,
                        repeatDelay: 1.4,
                        ease: 'easeInOut',
                      }
                    : { duration: 0.2 }
                }
              >
                <Sparkles
                  className="size-4"
                  style={{ stroke: 'url(#builder-chat-sparkles-gradient)' }}
                />
              </motion.span>
            </Button>
          </TooltipTrigger>
        </PopoverAnchor>
        <TooltipContent>{t('AI Assistant')}</TooltipContent>
      </Tooltip>
      {isCoachmarkVisible && (
        <div
          className="fixed inset-0 z-40 bg-scrim/30"
          onClick={dismissCoachmark}
        />
      )}
      <PopoverContent
        side="top"
        sideOffset={16}
        className="w-60 rounded-xl border-0 bg-accent-11 p-0 text-gray-1 shadow-lg"
      >
        <div className="h-32 w-full overflow-hidden rounded-t-xl bg-gray-1">
          <img
            src={coachmarkImage}
            alt=""
            className="size-full object-cover object-center"
          />
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold">{t('AI Assistant is here')}</p>
            <p className="text-sm leading-snug opacity-90">
              {t('Click the button below to reopen chat')}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissCoachmark}
            className="w-fit rounded-md bg-gray-1/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-1/25"
          >
            {t('Got it')}
          </button>
        </div>
        <span className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-accent-11" />
      </PopoverContent>
    </Popover>
  );
}
