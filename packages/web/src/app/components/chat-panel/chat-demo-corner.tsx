import { t } from 'i18next';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { Fragment, useEffect } from 'react';

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
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

import { useChatHistoryActions } from './chat-history-data';

export function ChatDemoCorner() {
  const settings = useChatDemoSettings();
  const { invalidate } = useChatHistoryActions();
  const keepOpen = (event: Event) => event.preventDefault();

  useEffect(() => {
    if (chatDemo.autoplayScenarioId) placeForAutoplay();
  }, []);

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
            {t('Speed: {speed}', { speed: speedLabel(settings.speed) })}
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
                  {speedLabel(speed)}
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

function speedLabel(speed: DemoSpeed): string {
  switch (speed) {
    case 'slow':
      return t('Slow');
    case 'normal':
      return t('Normal');
    case 'instant':
      return t('Instant');
  }
}

function placeForAutoplay() {
  const where = new URLSearchParams(window.location.search).get('chatDock');
  const panel = useChatPanel.getState();
  if (where === 'float') {
    panel.floatAt(panel.float ?? { x: window.innerWidth - 440, y: 96 });
    return;
  }
  panel.dock(where === 'left' ? 'left' : 'right');
}
