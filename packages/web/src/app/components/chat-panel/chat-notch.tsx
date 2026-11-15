import { t } from 'i18next';

import { ChatSparkIcon } from '@/components/icons/chat-spark';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { cn } from '@/lib/utils';

import { useChatWidth } from './chat-window';

export function ChatNotch({ className }: { className?: string }) {
  const hidden = useChatWidth() !== 'closed';
  return (
    <div
      className={cn(
        'pointer-events-none absolute z-10 size-25 max-md:hidden',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${NOTCH_BOX} ${NOTCH_BOX}`}
        aria-hidden
        className={cn(
          'absolute inset-0 size-full overflow-visible transition-opacity ease-(--ease-ap-out)',
          hidden ? 'opacity-0 duration-(--dur-fast)' : 'duration-(--dur-base)',
        )}
      >
        <path d={OUTLINE.fill} className="fill-gray-2" />
        <path
          d={OUTLINE.edge}
          vectorEffect="non-scaling-stroke"
          className="fill-none stroke-gray-6"
        />
      </svg>
      <TooltipProvider delayDuration={300}>
        <Tooltip open={hidden ? false : undefined}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              aria-label={t('Chat')}
              aria-hidden={hidden || undefined}
              tabIndex={hidden ? -1 : 0}
              onClick={() => useChatPanel.getState().setOpen(true)}
              className={cn(
                'group absolute bottom-0 left-0 flex size-12 items-start justify-start rounded-md pt-3.25 pl-3 text-gray-12 outline-hidden transition-[opacity,scale] ease-(--ease-ap-out) focus-visible:ring-2 focus-visible:ring-gray-8 focus-visible:ring-inset motion-reduce:transition-opacity',
                hidden
                  ? 'pointer-events-none scale-95 opacity-0 duration-(--dur-fast) motion-reduce:scale-100'
                  : 'pointer-events-auto duration-(--dur-base)',
              )}
            >
              <ChatSparkIcon
                strokeWidth={1.5}
                className="size-6"
                sparkClassName="fill-accent-9 stroke-accent-9"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {t('Chat')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function notchOutline(): { edge: string; fill: string } {
  const b = NOTCH_BOX;
  const w = NOTCH;
  const h = NOTCH;
  const fillet = Math.min(MAX_FILLET, Math.min(w, h) * FILLET_SHARE);
  const corner = fillet;
  const kF = 0.78;
  const kR = 0.62;
  const top = b - h;
  const edge = [
    `M 0.5 ${top - fillet}`,
    `C 0.5 ${top - fillet + fillet * kF} ${fillet - fillet * kF} ${
      top + 0.5
    } ${fillet} ${top + 0.5}`,
    `L ${w - corner} ${top + 0.5}`,
    `C ${w - corner + corner * kR} ${top + 0.5} ${w - 0.5} ${
      top + corner - corner * kR
    } ${w - 0.5} ${top + corner}`,
    `L ${w - 0.5} ${b - fillet}`,
    `C ${w - 0.5} ${b - fillet + fillet * kF} ${w + fillet - fillet * kF} ${
      b - 0.5
    } ${w + fillet} ${b - 0.5}`,
  ].join(' ');
  const fill = `${edge.replace('M 0.5', 'M 0')} L ${w + fillet} ${
    b + SHADOW_COVER
  } L 0 ${b + SHADOW_COVER} Z`;
  return { edge, fill };
}

const NOTCH = 48;
const NOTCH_BOX = 100;
const MAX_FILLET = 22;
const FILLET_SHARE = 0.37;
const SHADOW_COVER = 4;
const OUTLINE = notchOutline();
