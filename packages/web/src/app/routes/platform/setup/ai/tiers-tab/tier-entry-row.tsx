import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EntryWarning, modelMeta } from '@/features/agents/ai-model/model-meta';
import { cn } from '@/lib/utils';

import { keyStatusText } from '../providers-tab/key-status';

import { ModelDetailRow } from './model-detail-row';

export function TierEntryRow({
  entry,
  index,
  isLast,
  config,
  model,
  warnings,
  menu,
  loading,
  skipped,
}: TierEntryRowProps) {
  const isMain = index === 0;
  return (
    <div
      className={cn(
        'flex items-stretch gap-3 px-2 transition-opacity',
        skipped && 'opacity-50',
      )}
    >
      <div className="flex w-4 shrink-0 flex-col items-center">
        <span className={cn('w-px flex-1', !isMain && 'bg-gray-6')} />
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className={cn(
                'my-1 shrink-0 rounded-full',
                isMain
                  ? 'size-2.5 bg-accent-9 ring-4 ring-accent-3'
                  : 'size-2 border-2 border-gray-8 bg-panel',
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            {isMain
              ? t('Main model — tried first')
              : t('Fallback {rank} — tried when the models above fail', {
                  rank: index,
                })}
          </TooltipContent>
        </Tooltip>
        <span className={cn('w-px flex-1', !isLast && 'bg-gray-6')} />
      </div>
      <ModelDetailRow
        name={model?.name ?? entry.modelId}
        config={config}
        model={model}
        nameSuffix={
          <>
            {config !== undefined && config.projectScope !== 'all' && (
              <ScopeChip config={config} />
            )}
            {skipped && (
              <span className="shrink-0 rounded-full border border-gray-6 px-1.5 text-xss text-gray-11">
                {t('Skipped in this project')}
              </span>
            )}
            {warnings.length > 0 && <WarningsPopover warnings={warnings} />}
          </>
        }
        trailing={menu}
        loading={loading}
      />
    </div>
  );
}

function ScopeChip({ config }: { config: AIProviderWithoutSensitiveData }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="shrink-0 rounded-full border border-gray-6 bg-gray-2 px-1.5 text-xss text-gray-11"
        >
          {config.projectScope === 'except'
            ? t('exceptProjectsCount', { count: config.projectIds.length })
            : t('projectsCount', { count: config.projectIds.length })}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {t(
          "{key} only serves some projects. This model doesn't run in the others.",
          { key: config.name },
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function WarningsPopover({ warnings }: { warnings: EntryWarning[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-5 shrink-0 text-warning-11 hover:text-warning-12"
          aria-label={t('Warnings')}
        >
          <TriangleAlert className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 border-warning-7 bg-warning-3 p-3 text-warning-12"
      >
        <ul className="flex flex-col gap-1.5 text-xs">
          {warnings.map((warning) => (
            <li key={warning.code} className="flex items-start gap-1.5">
              <TriangleAlert className="mt-0.5 size-3 shrink-0" />
              <span>{warningText(warning)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function warningText(warning: EntryWarning): string {
  switch (warning.code) {
    case 'keyMissing':
      return t('Key not found — this model is skipped');
    case 'modelGone':
      return t("Not in {key}'s model list anymore", { key: warning.keyName });
    case 'smallerContext':
      return t('Smaller context ({context}) than the main model ({main})', {
        context: modelMeta.formatContext({ tokens: warning.contextTokens }),
        main: modelMeta.formatContext({ tokens: warning.mainContextTokens }),
      });
    case 'keyStatus':
      return t('Key status: {status} — tried last', {
        status: keyStatusText({ status: warning.status }) ?? warning.status,
      });
  }
}

type TierEntryRowProps = {
  entry: PlatformModelTierEntry;
  index: number;
  isLast: boolean;
  config: AIProviderWithoutSensitiveData | undefined;
  model: AIProviderModel | undefined;
  warnings: EntryWarning[];
  menu: ReactNode;
  loading: boolean;
  skipped: boolean;
};
