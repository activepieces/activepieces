import { t } from 'i18next';
import { Check, ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PublishingRuleSentence({
  count,
  mode,
  onModeChange,
}: {
  count: number;
  mode: 'any' | 'all';
  onModeChange: (mode: 'any' | 'all') => void;
}) {
  if (count === 0) {
    return (
      <p className="text-sm text-gray-11">
        {t('Flows can be published without using any particular action.')}
      </p>
    );
  }
  if (count === 1) {
    return (
      <p className="text-sm text-gray-12">
        {t('A flow can be published only if it uses this action:')}
      </p>
    );
  }
  return (
    <p className="text-sm leading-6 text-gray-12">
      {t('A flow can be published only if it uses')}{' '}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 rounded-sm bg-accent-3 px-1.5 font-medium text-accent-11 hover:bg-accent-4"
          >
            {mode === 'all' ? t('all') : t('at least one')}
            <ChevronDown className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {MODES.map((m) => (
            <DropdownMenuItem
              key={m.value}
              onSelect={() => onModeChange(m.value)}
              className="items-start"
            >
              <Check
                className={
                  m.value === mode ? 'mt-0.5 size-4' : 'mt-0.5 size-4 opacity-0'
                }
              />
              <span className="flex flex-col">
                <span className="font-medium">{t(m.label)}</span>
                <span className="text-xs text-gray-11">{t(m.hint)}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>{' '}
      {t('of these actions:')}
    </p>
  );
}

const MODES: { value: 'any' | 'all'; label: string; hint: string }[] = [
  {
    value: 'all',
    label: 'All of these actions',
    hint: 'Every action below has to be in the flow.',
  },
  {
    value: 'any',
    label: 'At least one of these actions',
    hint: 'Any one of the actions below is enough.',
  },
];
