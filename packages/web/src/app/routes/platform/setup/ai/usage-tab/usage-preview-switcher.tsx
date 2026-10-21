import { t } from 'i18next';
import { Check, FlaskConical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { USAGE_PRESETS, UsagePreset } from './usage-dummy-data';
import { UsageView } from './usage-header-controls';

export function UsagePreviewSwitcher({ view }: { view: UsageView }) {
  return (
    <div className="fixed right-4 bottom-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="shadow-md">
            <FlaskConical className="size-4" />
            {t('Preview: {preset}', {
              preset: presetLabel({ preset: view.preset }),
            })}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-72 p-2">
          <div className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
            <span className="text-sm font-medium text-gray-12">
              {t('Preview data')}
            </span>
            <span className="text-xs text-gray-11">
              {t(
                'Prototype only. Switches the dummy data so you can see each state.',
              )}
            </span>
          </div>
          <ul className="flex flex-col">
            {USAGE_PRESETS.map((preset) => (
              <li key={preset}>
                <button
                  type="button"
                  onClick={() => view.setPreset(preset)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-gray-3 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50',
                    view.preset === preset && 'bg-gray-3',
                  )}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center pt-0.5">
                    {view.preset === preset && (
                      <Check className="size-4 text-accent-11" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm text-gray-12">
                      {presetLabel({ preset })}
                    </span>
                    <span className="text-xs text-gray-11">
                      {presetHint({ preset })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function presetLabel({ preset }: { preset: UsagePreset }): string {
  switch (preset) {
    case 'loading':
      return t('Loading');
    case 'error':
      return t('Error');
    case 'empty':
      return t('Empty');
    case 'minimal':
      return t('Minimal setup');
    case 'half':
      return t('Half rich');
    case 'short-history':
      return t('Short history');
    case 'partial-history':
      return t('Partial comparison');
    case 'rich':
      return t('Rich');
  }
}

function presetHint({ preset }: { preset: UsagePreset }): string {
  switch (preset) {
    case 'loading':
      return t('Skeletons while the data loads');
    case 'error':
      return t('The usage request failed');
    case 'empty':
      return t('No AI calls yet');
    case 'minimal':
      return t('One project, two flows, one OpenAI key');
    case 'half':
      return t('Three projects, two agents and Activepieces credits');
    case 'short-history':
      return t(
        'Tracking started 25 days ago, so longer periods have no full comparison',
      );
    case 'partial-history':
      return t(
        'Tracking started 45 days ago, so on 30 days and this month the previous period is only partly there',
      );
    case 'rich':
      return t('A busy platform with every card filled');
  }
}
