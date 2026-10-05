import { AIProviderModel } from '@activepieces/shared';
import { t } from 'i18next';
import { Brain, Wrench } from 'lucide-react';
import { ReactNode } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AiProviderInfo } from '@/features/agents/ai-providers';
import { cn } from '@/lib/utils';

import { modelMeta } from './model-meta';

export function ModelRow({
  model,
  info,
  keyName,
  trailing,
  className,
}: ModelRowProps) {
  const parts = [
    ...(keyName === undefined ? [] : [keyName]),
    ...modelMeta.metaParts({ model }),
  ];
  return (
    <span className={cn('flex min-w-0 flex-1 items-center gap-3', className)}>
      {info !== undefined && info.logoUrl !== '' && (
        <LogoPlate src={info.logoUrl} alt={info.name} size="xs" />
      )}
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <TextWithTooltip tooltipMessage={model.name}>
          <span className="truncate text-sm font-medium">{model.name}</span>
        </TextWithTooltip>
        {parts.length > 0 && (
          <span className="truncate text-xs text-gray-11">
            {parts.join(' · ')}
          </span>
        )}
      </span>
      <CapabilityIcons model={model} />
      {trailing}
    </span>
  );
}

function CapabilityIcons({ model }: { model: AIProviderModel }) {
  const metadata = model.metadata;
  if (metadata === undefined) {
    return null;
  }
  const capabilities = [
    ...(metadata.supportsToolCalling === true
      ? [{ icon: Wrench, label: t('Supports tool calling') }]
      : []),
    ...(metadata.supportsReasoning === true
      ? [{ icon: Brain, label: t('Supports reasoning') }]
      : []),
  ];
  if (capabilities.length === 0) {
    return null;
  }
  return (
    <span className="flex shrink-0 items-center gap-1 text-gray-10">
      {capabilities.map(({ icon: Icon, label }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <span className="inline-flex" aria-label={label}>
              <Icon className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </span>
  );
}

type ModelRowProps = {
  model: AIProviderModel;
  info?: AiProviderInfo;
  keyName?: string;
  trailing?: ReactNode;
  className?: string;
};
