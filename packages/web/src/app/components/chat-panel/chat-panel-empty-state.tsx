import { t } from 'i18next';

import {
  chatDemo,
  useChatDemoSettings,
} from '@/features/chat/lib/demo/chat-demo';
import { demoScenarios } from '@/features/chat/lib/demo/demo-scenarios';
import { playDemoScenario } from '@/features/chat/lib/demo/play-scenario';
import { userHooks } from '@/hooks/user-hooks';

// The full chat page opens on a big hero. The panel is a side tool, so it opens
// on one line and a few quick starts, sitting right above the input.
const SUGGESTIONS = [
  'Build me a flow for new leads',
  'What saved us the most time this month?',
  'Why did my last run fail?',
];

export function ChatPanelEmptyState({
  onPick,
}: {
  onPick: (prompt: string) => void;
}) {
  const { data: user } = userHooks.useCurrentUser();
  const name = user?.firstName;

  return (
    <div className="flex h-full flex-col justify-end gap-3 px-4 pb-3">
      <p className="text-base font-semibold text-gray-12">
        {name
          ? t('Hi {name}, what should I do?', { name })
          : t('What should I do?')}
      </p>
      <div className="flex flex-col items-start gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            title={t(suggestion)}
            onClick={() => onPick(t(suggestion))}
            // One line each: a wrapped pill reads as a blob in a narrow panel.
            className="max-w-full truncate rounded-full border px-3 py-1.5 text-left text-sm text-gray-11 transition-colors duration-150 outline-none hover:bg-gray-3 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-gray-8 active:bg-gray-4"
          >
            {t(suggestion)}
          </button>
        ))}
      </div>
      {chatDemo.available && <DemoScenarioPills />}
    </div>
  );
}

// Dev builds, in demo mode: every scenario as a small pill.
function DemoScenarioPills() {
  const { active } = useChatDemoSettings();
  if (!active) return null;
  return (
    <div className="flex flex-col gap-1.5 border-t pt-3">
      <p className="text-xs text-gray-10">{t('Demo scenarios')}</p>
      <div className="flex flex-wrap gap-1">
        {demoScenarios.all.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            title={scenario.prompt}
            onClick={() => playDemoScenario(scenario.id)}
            className="max-w-full truncate rounded-full border border-dashed px-2 py-0.5 text-xs text-gray-11 transition-colors duration-150 outline-none hover:bg-gray-3 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-gray-8 active:bg-gray-4"
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </div>
  );
}
