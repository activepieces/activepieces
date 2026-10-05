import {
  AIProviderModel,
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

import { EntryWarning, modelMeta } from '@/features/agents/ai-model/model-meta';
import { ModelRow } from '@/features/agents/ai-model/model-row';

import { keyStatusText } from '../providers-tab/key-status';

export function TierEntryRow({
  entry,
  index,
  config,
  model,
  warnings,
  menu,
  reducedMotion,
}: TierEntryRowProps) {
  const isMain = index === 0;
  const shown: AIProviderModel = model ?? {
    id: entry.modelId,
    name: entry.modelId,
    type: AIProviderModelType.TEXT,
  };
  return (
    <div className="flex flex-col gap-1 rounded-md px-2 py-2 hover:bg-gray-2">
      <div className="flex items-center gap-3">
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
        <ModelRow
          model={shown}
          info={
            config === undefined
              ? undefined
              : modelMeta.providerInfoOf({ provider: config.provider })
          }
          keyName={config?.name}
          logoSize="sm"
        />
        {menu}
      </div>
      {warnings.length > 0 && (
        <ul className="flex flex-col gap-0.5 pl-8">
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
  menu: ReactNode;
  reducedMotion: boolean;
};
