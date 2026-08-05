import { AIProviderName } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Braces, ExternalLink, Eye, Image } from 'lucide-react';

export function ModelFactsRow({ model }: { model: AiModelFacts }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      <span>{t('{context} ctx', { context: formatTokens(model.contextWindow) })}</span>
      <span aria-hidden>·</span>
      <span>
        {t('${input} / ${output} per 1M', {
          input: model.cost.input,
          output: model.cost.output,
        })}
      </span>
      <span aria-hidden>·</span>
      <span>{SPEED_LABELS[model.speed]()}</span>
      {model.vision && (
        <span title={t('Vision')} className="inline-flex">
          <Eye className="size-3 shrink-0" />
        </span>
      )}
      {model.imageGeneration && (
        <span title={t('Image generation')} className="inline-flex">
          <Image className="size-3 shrink-0" />
        </span>
      )}
      {model.embeddings && (
        <span title={t('Embeddings')} className="inline-flex">
          <Braces className="size-3 shrink-0" />
        </span>
      )}
      <a
        href={model.detailsUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="inline-flex items-center gap-0.5 hover:text-foreground hover:underline"
      >
        <ExternalLink className="size-3 shrink-0" />
        {t('Details')}
      </a>
    </span>
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
