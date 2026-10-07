import { AI_PROVIDER_CAPABILITIES, OptionModel } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Minus } from 'lucide-react';
import { ReactNode } from 'react';

import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { modelMeta } from './model-meta';

export function ModelDetailCard({ detail }: { detail: ModelDetail }) {
  const { model } = detail;
  const metadata = model.metadata;
  const level = modelMeta.costLevel({ metadata });
  const capabilities = [
    {
      label: t('Tool calling'),
      value: metadata?.supportsToolCalling,
    },
    { label: t('Reasoning'), value: metadata?.supportsReasoning },
    { label: t('Vision'), value: metadata?.supportsVision },
    {
      label: t('Web search'),
      value: AI_PROVIDER_CAPABILITIES[model.provider]?.webSearch !== undefined,
    },
  ].filter((capability) => capability.value !== undefined);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {detail.leading}
          <span className="truncate font-medium">{detail.title}</span>
          {detail.badges}
        </div>
        {detail.description !== undefined && (
          <p className="text-xs text-gray-11">{detail.description}</p>
        )}
      </div>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-xs">
        {level !== null && (
          <DetailRow label={t('Cost')}>
            <span className="flex items-center justify-end gap-2">
              <CostBar level={level} />
              {detail.showPrices &&
                metadata?.inputCostPerMillionTokens !== undefined &&
                metadata.outputCostPerMillionTokens !== undefined && (
                  <span className="tabular-nums text-gray-11">
                    {modelMeta.formatPrice({
                      perMillion: metadata.inputCostPerMillionTokens,
                    })}
                    {' / '}
                    {modelMeta.formatPrice({
                      perMillion: metadata.outputCostPerMillionTokens,
                    })}
                  </span>
                )}
            </span>
          </DetailRow>
        )}
        {metadata?.contextTokens !== undefined && (
          <DetailRow label={t('Context')}>
            {t('{size} tokens', {
              size: modelMeta.formatContext({
                tokens: metadata.contextTokens,
              }),
            })}
          </DetailRow>
        )}
        {metadata?.releaseDate !== undefined && (
          <DetailRow label={t('Released')}>
            {formatUtils.formatDateOnly(new Date(metadata.releaseDate))}
          </DetailRow>
        )}
        {detail.title !== model.name && (
          <DetailRow label={t('Model')}>
            <span className="truncate" title={model.name}>
              {model.name}
            </span>
          </DetailRow>
        )}
        <DetailRow label={t('Runs on')}>
          <span className="truncate" title={detail.runsOn}>
            {detail.runsOn}
          </span>
        </DetailRow>
        {detail.fallbacks.length > 0 && (
          <DetailRow label={t('Then tries')}>
            <span className="truncate" title={detail.fallbacks.join(' → ')}>
              {detail.fallbacks.join(' → ')}
            </span>
          </DetailRow>
        )}
      </dl>
      {capabilities.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t pt-3 text-xs">
          {capabilities.map((capability) => (
            <li
              key={capability.label}
              className="flex items-center justify-between"
            >
              <span>{capability.label}</span>
              {capability.value === true ? (
                <Check
                  className="size-3.5 text-success-11"
                  aria-label={t('Yes')}
                />
              ) : (
                <Minus className="size-3.5 text-gray-9" aria-label={t('No')} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CostBar({ level }: { level: number }) {
  return (
    <span
      className="flex gap-0.5"
      role="img"
      aria-label={t('Cost {level} of 5', { level })}
    >
      {COST_SEGMENTS.map((segment) => (
        <span
          key={segment}
          className={cn(
            'h-1.5 w-4 rounded-full',
            segment <= level ? costColor({ level }) : 'bg-gray-4',
          )}
        />
      ))}
    </span>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt className="text-gray-11">{label}</dt>
      <dd className="flex min-w-0 justify-end text-right text-gray-12">
        {children}
      </dd>
    </>
  );
}

function costColor({ level }: { level: number }): string {
  if (level <= 2) {
    return 'bg-success-9';
  }
  return level === 3 ? 'bg-warning-9' : 'bg-danger-9';
}

const COST_SEGMENTS = [1, 2, 3, 4, 5];

export type ModelDetail = {
  title: string;
  leading: ReactNode;
  badges?: ReactNode;
  description?: string;
  model: OptionModel;
  runsOn: string;
  fallbacks: string[];
  showPrices: boolean;
};
