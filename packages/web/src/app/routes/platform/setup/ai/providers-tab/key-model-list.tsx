import {
  AIProviderModel,
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Brain,
  Eye,
  ImageIcon,
  ListChecks,
  LucideIcon,
  Search,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { modelMeta } from '@/features/agents/ai-model/model-meta';
import { cn } from '@/lib/utils';

import { ModelDetailRow } from '../components/model-detail-row';

import {
  keyModelFilters,
  ModelCapabilityFilter,
  ModelSort,
} from './key-model-filters';

export function KeyModelList({
  config,
  models,
  staleIds,
  tiersByModel,
  allModels,
  selectedIds,
  isLoading,
  onChange,
}: KeyModelListProps) {
  const [search, setSearch] = useState('');
  const [capabilities, setCapabilities] = useState<ModelCapabilityFilter[]>([]);
  const [sort, setSort] = useState<ModelSort>('newest');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  const isOn = (modelId: string) =>
    allModels || selectedIds.includes(modelId) || tiersByModel.has(modelId);
  const filtered = keyModelFilters.apply({
    models,
    search,
    capabilities,
    sort,
    selectedOnly: selectedOnly && !allModels,
    selectedIds,
  });
  const page = filtered.slice(0, shown);
  const filteredIds = filtered.map((model) => model.id);
  const onCount = allModels
    ? models.length
    : models.filter((model) => isOn(model.id)).length;
  const providerName = modelMeta.providerInfoOf({
    provider: config.provider,
  }).name;

  const resetPaging = () => setShown(PAGE_SIZE);
  const toggleModel = (modelId: string) => {
    if (allModels || tiersByModel.has(modelId)) {
      return;
    }
    onChange(
      selectedIds.includes(modelId)
        ? selectedIds.filter((id) => id !== modelId)
        : [...selectedIds, modelId],
    );
  };
  const toggleCapability = (capability: ModelCapabilityFilter) => {
    setCapabilities(
      capabilities.includes(capability)
        ? capabilities.filter((current) => current !== capability)
        : [...capabilities, capability],
    );
    resetPaging();
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-6/60">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <InputWithIcon
            icon={<Search className="size-4 shrink-0 text-gray-11" />}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPaging();
            }}
            placeholder={t('Search models')}
            className="max-w-xs grow-0"
          />
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(sortOf(value));
              resetPaging();
            }}
          >
            <SelectTrigger className="w-40 shrink-0" aria-label={t('Sort')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((option) => (
                <SelectItem key={option} value={option}>
                  {sortLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CAPABILITY_CHIPS.map(({ capability, icon }) => (
            <FilterCheck
              key={capability}
              icon={icon}
              label={capabilityLabel(capability)}
              checked={capabilities.includes(capability)}
              onCheckedChange={() => toggleCapability(capability)}
            />
          ))}
          {!allModels && (
            <FilterCheck
              icon={ListChecks}
              label={t('Selected only')}
              checked={selectedOnly}
              onCheckedChange={(checked) => {
                setSelectedOnly(checked);
                resetPaging();
              }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-6/60 bg-gray-2 px-4 py-2 text-xs text-gray-11">
        <span className="tabular-nums">
          {isLoading
            ? t('Loading models…')
            : t('{on} of {total} on', { on: onCount, total: models.length })}
        </span>
        {allModels ? (
          <span>
            {t('New models from {provider} are added automatically.', {
              provider: providerName,
            })}
          </span>
        ) : (
          filtered.length > 0 && (
            <span className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() =>
                  onChange([...new Set([...selectedIds, ...filteredIds])])
                }
              >
                {t('Select all')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() =>
                  onChange(
                    selectedIds.filter((id) => !filteredIds.includes(id)),
                  )
                }
              >
                {t('Clear')}
              </Button>
            </span>
          )
        )}
      </div>

      <div className="flex flex-col border-t border-gray-6/60">
        {isLoading &&
          [0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex items-center gap-3 border-b border-gray-6/60 px-4 py-3 last:border-b-0"
            >
              <Skeleton className="size-4 rounded-sm" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        {!isLoading && filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-11">
            {models.length === 0
              ? t('No models found')
              : selectedOnly
              ? t('No model is selected yet.')
              : t('No model matches your search.')}
          </p>
        )}
        {!isLoading &&
          page.map((model) => {
            const tierNames = tiersByModel.get(model.id);
            const locked = allModels || tierNames !== undefined;
            return (
              <label
                key={model.id}
                className={cn(
                  'flex items-center gap-3 border-b border-gray-6/60 pl-4 pr-3 last:border-b-0',
                  locked ? 'cursor-default' : 'cursor-pointer hover:bg-gray-2',
                )}
              >
                <Checkbox
                  checked={isOn(model.id)}
                  disabled={locked}
                  onCheckedChange={() => toggleModel(model.id)}
                  aria-label={model.name}
                />
                <ModelDetailRow
                  name={model.name}
                  config={config}
                  model={model}
                  nested
                  nameSuffix={
                    <ModelBadges
                      model={model}
                      stale={staleIds.includes(model.id)}
                      tierNames={tierNames}
                    />
                  }
                />
              </label>
            );
          })}
        {filtered.length > page.length && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="m-2 self-start"
            onClick={() => setShown((current) => current + PAGE_SIZE)}
          >
            {t('Show {count} more', {
              count: Math.min(PAGE_SIZE, filtered.length - page.length),
            })}
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterCheck({
  icon: Icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'inline-flex h-8 cursor-pointer select-none items-center gap-2 rounded-lg border border-gray-6 bg-gray-1 px-2.5 text-xs font-medium text-gray-12 transition-colors hover:bg-gray-2',
        checked && 'border-gray-8 bg-gray-3 hover:bg-gray-3',
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Icon className="size-3.5 text-gray-11" />
      {label}
    </label>
  );
}

function ModelBadges({
  model,
  stale,
  tierNames,
}: {
  model: AIProviderModel;
  stale: boolean;
  tierNames: string[] | undefined;
}) {
  return (
    <>
      {model.id !== model.name && (
        <span className="hidden truncate font-mono text-xs text-gray-10 sm:inline">
          {model.id}
        </span>
      )}
      {model.type === AIProviderModelType.IMAGE && (
        <Badge variant="secondary" className="shrink-0">
          {t('Image')}
        </Badge>
      )}
      {stale && (
        <Badge variant="warning" className="shrink-0">
          {t('Not offered anymore')}
        </Badge>
      )}
      {tierNames !== undefined && (
        <Badge variant="info" className="shrink-0">
          {t('Used by {tiers}', { tiers: tierNames.join(', ') })}
        </Badge>
      )}
    </>
  );
}

function sortOf(value: string): ModelSort {
  return SORTS.find((option) => option === value) ?? 'newest';
}

function sortLabel(sort: ModelSort): string {
  switch (sort) {
    case 'newest':
      return t('Newest');
    case 'cheapest':
      return t('Cheapest');
    case 'context':
      return t('Biggest context');
    case 'name':
      return t('Name');
  }
}

function capabilityLabel(capability: ModelCapabilityFilter): string {
  switch (capability) {
    case 'toolCalling':
      return t('Tool calling');
    case 'reasoning':
      return t('Reasoning');
    case 'vision':
      return t('Vision');
    case 'image':
      return t('Image generation');
  }
}

const PAGE_SIZE = 20;

const SORTS: ModelSort[] = ['newest', 'cheapest', 'context', 'name'];

const CAPABILITY_CHIPS: {
  capability: ModelCapabilityFilter;
  icon: LucideIcon;
}[] = [
  { capability: 'toolCalling', icon: Wrench },
  { capability: 'reasoning', icon: Brain },
  { capability: 'vision', icon: Eye },
  { capability: 'image', icon: ImageIcon },
];

type KeyModelListProps = {
  config: AIProviderWithoutSensitiveData;
  models: AIProviderModel[];
  staleIds: string[];
  tiersByModel: Map<string, string[]>;
  allModels: boolean;
  selectedIds: string[];
  isLoading: boolean;
  onChange: (modelIds: string[]) => void;
};
