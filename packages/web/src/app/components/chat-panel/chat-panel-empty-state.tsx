import { t } from 'i18next';

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
            onClick={() => onPick(t(suggestion))}
            className="rounded-full border px-3 py-1.5 text-left text-sm text-gray-11 transition-colors duration-150 hover:bg-gray-3 hover:text-gray-12"
          >
            {t(suggestion)}
          </button>
        ))}
      </div>
    </div>
  );
}
