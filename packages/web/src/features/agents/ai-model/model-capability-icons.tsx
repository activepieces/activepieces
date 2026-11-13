import {
  AI_PROVIDER_CAPABILITIES,
  AIProviderModelMetadata,
  AIProviderModelType,
  AIProviderName,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Brain, Eye, Globe, ImageIcon, LucideIcon, Wrench } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ModelCapabilityIcons({
  provider,
  metadata,
  modelType,
}: {
  provider: AIProviderName;
  metadata: AIProviderModelMetadata | undefined;
  modelType?: AIProviderModelType;
}) {
  const slots: { icon: LucideIcon; label: string; on: boolean }[] = [
    {
      icon: Wrench,
      label: t('Tool calling'),
      on: metadata?.supportsToolCalling === true,
    },
    {
      icon: Brain,
      label: t('Reasoning'),
      on: metadata?.supportsReasoning === true,
    },
    { icon: Eye, label: t('Vision'), on: metadata?.supportsVision === true },
    modelType === undefined
      ? {
          icon: Globe,
          label: t('Web search'),
          on: AI_PROVIDER_CAPABILITIES[provider]?.webSearch !== undefined,
        }
      : {
          icon: ImageIcon,
          label: t('Image generation'),
          on: modelType === AIProviderModelType.IMAGE,
        },
  ];
  return (
    <span className="flex shrink-0 items-center gap-1">
      {slots.map(({ icon: Icon, label, on }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex size-5 items-center justify-center rounded-sm',
                on ? 'bg-gray-3 text-gray-11' : 'text-gray-7',
              )}
              aria-label={
                on
                  ? label
                  : t('{capability} not available', { capability: label })
              }
            >
              <Icon className="size-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {on
              ? label
              : t('{capability} not available', { capability: label })}
          </TooltipContent>
        </Tooltip>
      ))}
    </span>
  );
}
