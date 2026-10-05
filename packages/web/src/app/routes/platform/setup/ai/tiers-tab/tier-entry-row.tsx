import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { GripVertical, TriangleAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { SortableDragHandle } from '@/components/ui/sortable';
import { EntryWarning, modelMeta } from '@/features/agents/ai-model/model-meta';
import { cn } from '@/lib/utils';

import { keyStatusText } from '../providers-tab/key-status';
import { ProviderLogo } from '../providers-tab/provider-logo';

export function TierEntryRow({
  entry,
  index,
  config,
  model,
  warnings,
  trailing,
  menu,
  showHandle,
  reducedMotion,
}: TierEntryRowProps) {
  const isMain = index === 0;
  const meta = model === undefined ? [] : modelMeta.metaParts({ model });
  return (
    <div className="flex flex-col gap-1 rounded-md px-2 py-1.5 hover:bg-gray-2">
      <div className="flex items-center gap-2">
        {showHandle ? (
          <SortableDragHandle
            variant="ghost"
            size="icon-xs"
            className="text-gray-10"
            aria-label={t('Drag to reorder')}
          >
            <GripVertical className="size-3.5" />
          </SortableDragHandle>
        ) : (
          <span className="size-6 shrink-0" />
        )}
        <span
          className="flex size-5 shrink-0 items-center justify-center text-xs tabular-nums text-gray-11"
          aria-label={
            isMain ? t('Main model') : t('Fallback {rank}', { rank: index })
          }
        >
          {isMain ? (
            <motion.span
              key={modelMeta.entryKey({ entry })}
              className="size-2 rounded-full bg-accent-9"
              initial={{ scale: 1 }}
              animate={reducedMotion ? undefined : { scale: [1, 1.4, 1] }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <span className="flex size-5 items-center justify-center rounded-full bg-gray-3">
              {index}
            </span>
          )}
        </span>
        {config !== undefined && (
          <ProviderLogo
            info={modelMeta.providerInfoOf({ provider: config.provider })}
            size="sm"
          />
        )}
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <TextWithTooltip tooltipMessage={model?.name ?? entry.modelId}>
            <span className="truncate text-sm font-medium">
              {model?.name ?? entry.modelId}
            </span>
          </TextWithTooltip>
          {config !== undefined && (
            <span className="hidden truncate text-xs text-gray-11 sm:inline">
              {config.name}
            </span>
          )}
          {meta.length > 0 && (
            <span className="hidden truncate text-xs text-gray-10 lg:inline">
              {meta.join(' · ')}
            </span>
          )}
        </div>
        {trailing}
        {menu}
      </div>
      {warnings.length > 0 && (
        <ul className={cn('flex flex-col gap-0.5 pl-[4.25rem]')}>
          {warnings.map((warning) => (
            <li
              key={warning.code}
              className="flex items-center gap-1.5 text-xs text-warning-11"
            >
              <TriangleAlert className="size-3 shrink-0" />
              <span>{warningText(warning)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
  config: AIProviderWithoutSensitiveData | undefined;
  model: AIProviderModel | undefined;
  warnings: EntryWarning[];
  trailing: ReactNode;
  menu?: ReactNode;
  showHandle: boolean;
  reducedMotion: boolean;
};
