import { t } from 'i18next';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { Fragment } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  chatDemo,
  DemoSpeed,
  useChatDemoSettings,
} from '@/features/chat/lib/demo/chat-demo';
import { demoScenarios } from '@/features/chat/lib/demo/demo-scenarios';
import { playDemoScenario } from '@/features/chat/lib/demo/play-scenario';

import { useChatHistoryActions } from './chat-history-data';

const DEMO_SPEED_LABELS: Record<DemoSpeed, string> = {
  slow: 'Slow',
  normal: 'Normal',
  instant: 'Instant',
};

// Dev builds (or ?chatDemo=1) only: one quiet button in the bottom-right
// corner. Picking a scenario plays it through the real chat, so you see what
// a user sees: the panel opening, replies streaming, the page reacting.
export function ChatDemoCorner() {
  if (!chatDemo.available) return null;
  return <DemoCornerMenu />;
}

function DemoCornerMenu() {
  const settings = useChatDemoSettings();
  const { invalidate } = useChatHistoryActions();
  const keepOpen = (event: Event) => event.preventDefault();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('Demo scenarios')}
          title={t('Demo scenarios')}
          className="fixed right-3 bottom-3 z-30 flex size-7 items-center justify-center rounded-full border bg-gray-1 text-gray-10 opacity-60 shadow-xs transition-opacity duration-150 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-gray-8 data-[state=open]:opacity-100"
        >
          <FlaskConical className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
        className="max-h-[min(70vh,600px)] w-60 overflow-y-auto"
      >
        {demoScenarios.groups.map((group, index) => (
          <Fragment key={group}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-normal text-gray-10">
              {group}
            </DropdownMenuLabel>
            {demoScenarios.all
              .filter((scenario) => scenario.group === group)
              .map((scenario) => (
                <DropdownMenuItem
                  key={scenario.id}
                  onSelect={() => playDemoScenario(scenario.id)}
                >
                  {scenario.label}
                </DropdownMenuItem>
              ))}
          </Fragment>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!settings.lastScenarioId}
          onSelect={() =>
            settings.lastScenarioId && playDemoScenario(settings.lastScenarioId)
          }
        >
          <RotateCcw className="size-4" />
          {t('Replay last')}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {t('Speed: {speed}', {
              speed: t(DEMO_SPEED_LABELS[settings.speed]),
            })}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={settings.speed}
              onValueChange={(value) => {
                const speed = chatDemo.SPEEDS.find((s) => s === value);
                if (speed) chatDemo.setSpeed(speed);
              }}
            >
              {chatDemo.SPEEDS.map((speed) => (
                <DropdownMenuRadioItem
                  key={speed}
                  value={speed}
                  onSelect={keepOpen}
                >
                  {t(DEMO_SPEED_LABELS[speed])}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuCheckboxItem
          checked={settings.fakeHistory}
          onSelect={keepOpen}
          onCheckedChange={(checked) => {
            chatDemo.setFakeHistory(checked);
            invalidate();
          }}
        >
          {t('Fake chat history')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.active}
          onSelect={keepOpen}
          onCheckedChange={(checked) => chatDemo.setActive(checked)}
        >
          {t('Demo mode for new chats')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
