import { AI_PROVIDER_CAPABILITIES, OptionModel } from '@activepieces/shared';
import dayjs from 'dayjs';
import i18next, { t } from 'i18next';
import { Check } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { modelMeta } from './model-meta';

export function ModelDetailCard({ detail }: { detail: ModelDetail }) {
  const { model } = detail;
  const metadata = model.metadata;
  const released =
    metadata?.releaseDate === undefined ? null : dayjs(metadata.releaseDate);
  const capabilities = [
    { label: t('Tool calling'), value: metadata?.supportsToolCalling },
    { label: t('Reasoning'), value: metadata?.supportsReasoning },
    { label: t('Vision'), value: metadata?.supportsVision },
    {
      label: t('Web search'),
      value: AI_PROVIDER_CAPABILITIES[model.provider]?.webSearch !== undefined,
    },
  ];
  const chain = [
    { name: model.name, keyName: detail.runsOn },
    ...detail.fallbacks,
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {detail.leading}
          <span className="truncate text-base font-semibold text-gray-12">
            {detail.title}
          </span>
          {detail.badges}
        </div>
        {detail.description !== undefined && (
          <p className="text-sm leading-relaxed text-gray-11">
            {detail.description}
          </p>
        )}
      </div>

      <dl className="flex flex-col gap-2.5 px-3 text-xs">
        {detail.title !== model.name && (
          <DetailRow label={t('Model')}>{model.name}</DetailRow>
        )}
        {chain.length === 1 && (
          <DetailRow label={t('Runs on')}>{detail.runsOn}</DetailRow>
        )}
        {metadata?.contextTokens !== undefined && (
          <DetailRow label={t('Context')}>
            {t('{size} tokens', {
              size: modelMeta.formatContext({ tokens: metadata.contextTokens }),
            })}
          </DetailRow>
        )}
        {detail.showPrices &&
          metadata?.inputCostPerMillionTokens !== undefined &&
          metadata.outputCostPerMillionTokens !== undefined && (
            <DetailRow label={t('Price per 1M')}>
              {t('{input} in · {output} out', {
                input: modelMeta.formatPrice({
                  perMillion: metadata.inputCostPerMillionTokens,
                }),
                output: modelMeta.formatPrice({
                  perMillion: metadata.outputCostPerMillionTokens,
                }),
              })}
            </DetailRow>
          )}
        {released !== null && released.isValid() && (
          <DetailRow label={t('Released')}>
            <span className="flex items-center justify-end gap-1.5">
              {dayjs().diff(released, 'day') <= NEW_MODEL_DAYS && (
                <span className="rounded-full bg-success-3 px-1.5 py-0.5 text-xss leading-none text-success-11">
                  {t('New')}
                </span>
              )}
              {Intl.DateTimeFormat(i18next.language, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(released.toDate())}
            </span>
          </DetailRow>
        )}
      </dl>

      {chain.length > 1 && (
        <div className="flex flex-col gap-2.5 border-t px-3 pt-4">
          <span className="text-xs text-gray-11">
            {t('Tries in this order')}
          </span>
          <ol className="relative flex flex-col gap-2.5">
            <span className="absolute top-1.5 bottom-1.5 left-[4.5px] w-px bg-gray-7" />
            {chain.map((step, index) => (
              <li
                key={`${step.keyName}:${step.name}`}
                className="relative flex min-w-0 items-center gap-2.5 text-xs"
              >
                <span
                  className={cn(
                    'size-2.5 shrink-0 rounded-full ring-2 ring-panel',
                    index === 0 ? 'bg-accent-10' : 'bg-gray-8',
                  )}
                />
                <span
                  className={cn(
                    'truncate',
                    index === 0 ? 'font-medium text-gray-12' : 'text-gray-11',
                  )}
                  title={step.name}
                >
                  {step.name}
                </span>
                <span className="ml-auto shrink-0 truncate text-gray-10">
                  {step.keyName}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-t px-3 pt-4">
        {capabilities.map((capability) =>
          capability.value === true ? (
            <span
              key={capability.label}
              className="flex items-center gap-1 rounded-full bg-success-3 px-2 py-0.5 text-xs text-success-11"
            >
              <Check className="size-3 text-success-11" />
              {capability.label}
            </span>
          ) : (
            <span
              key={capability.label}
              className="rounded-full bg-gray-3 px-2 py-0.5 text-xs text-gray-10 line-through"
            >
              {capability.label}
            </span>
          ),
        )}
      </div>
    </div>
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
    <div className="flex min-w-0 items-baseline justify-between gap-4">
      <dt className="shrink-0 text-xs text-gray-11">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-gray-12">
        {children}
      </dd>
    </div>
  );
}

const NEW_MODEL_DAYS = 60;

export type ModelDetail = {
  title: string;
  leading: ReactNode;
  badges?: ReactNode;
  description?: string;
  model: OptionModel;
  runsOn: string;
  fallbacks: { name: string; keyName: string }[];
  showPrices: boolean;
};
