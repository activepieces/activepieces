import { AIProviderName } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Braces, ExternalLink, Eye, Image, LucideIcon } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ModelFactsRow({ model }: { model: AiModelFacts }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default tabular-nums">
            {formatTokens(model.contextWindow)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {t('Context window: {tokens} tokens', {
            tokens: model.contextWindow.toLocaleString(),
          })}
        </TooltipContent>
      </Tooltip>
      <span aria-hidden>·</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default tabular-nums">
            ${model.cost.input}/M
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {t('${input} input / ${output} output per 1M tokens', {
            input: model.cost.input,
            output: model.cost.output,
          })}
        </TooltipContent>
      </Tooltip>
      <span aria-hidden>·</span>
      <span>{SPEED_LABELS[model.speed]()}</span>
    </span>
  );
}

export function ModelCapabilityIcons({ model }: { model: AiModelFacts }) {
  return (
    <span className="flex items-center gap-1">
      {model.vision && <FactIcon icon={Eye} label={t('Understands images')} />}
      {model.imageGeneration && (
        <FactIcon icon={Image} label={t('Generates images')} />
      )}
      {model.embeddings && (
        <FactIcon icon={Braces} label={t('Embeddings for knowledge bases')} />
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={model.detailsUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="flex size-6 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="top">{t('View model details')}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function FactIcon({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex size-6 cursor-default items-center justify-center rounded-md border bg-background text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${tokens / 1_000_000}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K`;
  }
  return `${tokens}`;
}

const SPEED_LABELS: Record<AiModelFacts['speed'], () => string> = {
  fast: () => t('Fast'),
  medium: () => t('Medium'),
  slow: () => t('Slow'),
};

export type AiModelFacts = {
  id: string;
  name: string;
  provider: AIProviderName;
  contextWindow: number;
  cost: { input: number; output: number };
  speed: 'fast' | 'medium' | 'slow';
  vision: boolean;
  imageGeneration: boolean;
  embeddings: boolean;
  detailsUrl: string;
};
