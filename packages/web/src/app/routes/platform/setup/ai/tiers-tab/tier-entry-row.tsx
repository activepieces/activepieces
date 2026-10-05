import {
  AIProviderModel,
  AIProviderModelType,
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
import { EntryWarning, modelMeta } from '@/features/agents/ai-model/model-meta';
import { ModelRow } from '@/features/agents/ai-model/model-row';

import { keyStatusText } from '../providers-tab/key-status';

export function TierEntryRow({
  entry,
  isMain,
  config,
  model,
  warnings,
  menu,
}: TierEntryRowProps) {
  const shown: AIProviderModel = model ?? {
    id: entry.modelId,
    name: entry.modelId,
    type: AIProviderModelType.TEXT,
  };
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-2">
      <ModelRow
        model={shown}
        info={
          config === undefined
            ? undefined
            : modelMeta.providerInfoOf({ provider: config.provider })
        }
        keyName={config?.name}
        logoSize="sm"
        nameSuffix={
          <>
            {isMain && (
              <span className="shrink-0 rounded-sm bg-accent-3 px-1.5 py-px text-xss font-medium uppercase tracking-wide text-accent-11">
                {t('Main')}
              </span>
            )}
            {warnings.length > 0 && <WarningsPopover warnings={warnings} />}
          </>
        }
      />
      {menu}
    </div>
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
  isMain: boolean;
  config: AIProviderWithoutSensitiveData | undefined;
  model: AIProviderModel | undefined;
  warnings: EntryWarning[];
  menu: ReactNode;
};
