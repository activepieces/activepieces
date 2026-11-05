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
import { useId, useState } from 'react';

import { adminSurface } from '@/app/components/admin';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
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
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { ModelCapabilityIcons } from '@/features/agents/ai-model/model-capability-icons';
import { modelMeta } from '@/features/agents/ai-model/model-meta';
import { cn } from '@/lib/utils';

import {
  keyModelFilters,
  ModelCapabilityFilter,
  ModelSort,
} from './key-model-filters';
import { KeyModelSelection, keyModelSelection } from './key-model-selection';

export function KeyModelList({
  config,
  models,
  staleIds,
  tiersByModel,
  selection,
  isLoading,
  onChange,
}: KeyModelListProps) {
  const switchId = useId();
  const [search, setSearch] = useState('');
  const [capabilities, setCapabilities] = useState<ModelCapabilityFilter[]>([]);
  const [sort, setSort] = useState<ModelSort>('newest');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  const allModels = selection.modelScope === 'all';
  const lockedIds = [...tiersByModel.keys()];
  const listedIds = models.map((model) => model.id);
  const isOn = (modelId: string) =>
    keyModelSelection.isOn({ selection, modelId, lockedIds });
  const canSelect = (ids: string[]) => ids.some((id) => !isOn(id));
  const canClear = (ids: string[]) =>
    ids.some((id) => isOn(id) && !lockedIds.includes(id));
  const filtered = keyModelFilters.apply({
    models,
    search,
    capabilities,
    sort,
    selectedOnly: selectedOnly && !allModels,
    selectedIds: selection.modelIds,
  });
  const page = filtered.slice(0, shown);
  const filteredIds = filtered.map((model) => model.id);
  const filtering =
    search.trim() !== '' ||
    capabilities.length > 0 ||
    (selectedOnly && !allModels);
  const onCount = listedIds.filter(isOn).length;
  const providerName = modelMeta.providerInfoOf({
    provider: config.provider,
  }).name;
  const leftAutoAdd = config.modelScope === 'all' && !allModels;

  const resetPaging = () => setShown(PAGE_SIZE);
  const selectIds = (ids: string[]) =>
    onChange(keyModelSelection.select({ selection, ids, lockedIds }));
  const clearIds = (ids: string[]) =>
    onChange(keyModelSelection.clear({ selection, ids, listedIds, lockedIds }));
  const toggleCapability = (capability: ModelCapabilityFilter) => {
    setCapabilities(
      capabilities.includes(capability)
        ? capabilities.filter((current) => current !== capability)
        : [...capabilities, capability],
    );
    resetPaging();
  };

  return (
    <div className={cn(adminSurface.card, 'flex flex-col overflow-hidden')}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-gray-6 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <Switch
            id={switchId}
            checked={allModels}
            disabled={isLoading}
            aria-describedby={`${switchId}-note`}
            onCheckedChange={(on) =>
              onChange(
                keyModelSelection.setAutoAdd({ on, listedIds, lockedIds }),
              )
            }
            className="mt-0.5"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <label
              htmlFor={switchId}
              className="cursor-pointer text-sm font-semibold text-gray-12"
            >
              {t('Add new {provider} models automatically', {
                provider: providerName,
              })}
            </label>
            <p id={`${switchId}-note`} className="text-sm text-gray-11">
              {allModels
                ? t(
                    'Every model is allowed. Untick one to pick models yourself.',
                  )
                : leftAutoAdd
                ? t(
                    'New models won’t be added automatically. Turn this on to allow all models again.',
                  )
                : t('Only the ticked models are allowed.')}
            </p>
          </div>
        </div>
        <span className="text-sm tabular-nums text-gray-11">
          {isLoading
            ? t('Loading models…')
            : t('modelsAllowedCount', {
                count: onCount,
                total: models.length,
              })}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4">
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
          {!isLoading && (
            <div className="ml-auto flex flex-wrap items-center gap-1">
              {filtering && (
                <>
                  <BulkButton
                    label={t('Select shown')}
                    disabled={!canSelect(filteredIds)}
                    onClick={() => selectIds(filteredIds)}
                  />
                  <BulkButton
                    label={t('Clear shown')}
                    disabled={!canClear(filteredIds)}
                    onClick={() => clearIds(filteredIds)}
                  />
                </>
              )}
              <BulkButton
                label={t('Select all')}
                disabled={!canSelect(listedIds)}
                onClick={() => selectIds(listedIds)}
              />
              <BulkButton
                label={t('Clear')}
                disabled={!canClear(listedIds)}
                onClick={() => clearIds(listedIds)}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CAPABILITY_CHIPS.map(({ capability, icon }) => (
            <FilterToggle
              key={capability}
              icon={icon}
              label={capabilityLabel(capability)}
              pressed={capabilities.includes(capability)}
              onPressedChange={() => toggleCapability(capability)}
            />
          ))}
          {!allModels && (
            <FilterToggle
              icon={ListChecks}
              label={t('Selected only')}
              pressed={selectedOnly}
              onPressedChange={(pressed) => {
                setSelectedOnly(pressed);
                resetPaging();
              }}
            />
          )}
        </div>
      </div>

      <div
        className={cn(
          ROW_GRID,
          'border-y border-gray-6 bg-gray-2 py-2 text-xs font-medium text-gray-11',
        )}
      >
        <span />
        <span>{t('Model')}</span>
        <span className="hidden text-right md:block">{t('Context')}</span>
        <span className="hidden text-right md:block">{t('Price per 1M')}</span>
        <span className="hidden md:block">{t('Can')}</span>
      </div>

      <div className="flex flex-col">
        {isLoading &&
          [0, 1, 2].map((row) => (
            <div
              key={row}
              className={cn(
                ROW_GRID,
                'border-b border-gray-6 py-3 last:border-b-0',
              )}
            >
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-3.5 w-40" />
            </div>
          ))}
        {!isLoading && filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-11">
            {models.length === 0
              ? t('No models found')
              : selectedOnly && !allModels
              ? t('No model is selected yet.')
              : t('No model matches your search.')}
          </p>
        )}
        {!isLoading &&
          page.map((model) => {
            const tierNames = tiersByModel.get(model.id);
            const locked = tierNames !== undefined;
            return (
              <label
                key={model.id}
                className={cn(
                  ROW_GRID,
                  'min-h-12 border-b border-gray-6 py-2.5 transition-colors last:border-b-0',
                  locked ? 'cursor-default' : 'cursor-pointer hover:bg-gray-3',
                )}
              >
                <Checkbox
                  checked={isOn(model.id)}
                  disabled={locked}
                  onCheckedChange={() =>
                    onChange(
                      keyModelSelection.toggle({
                        selection,
                        modelId: model.id,
                        listedIds,
                        lockedIds,
                      }),
                    )
                  }
                  aria-label={model.name}
                />
                <span className="flex min-w-0 items-center gap-1.5">
                  <TextWithTooltip tooltipMessage={model.name}>
                    <span className="truncate text-sm font-medium text-gray-12">
                      {model.name}
                    </span>
                  </TextWithTooltip>
                  <ModelBadges
                    model={model}
                    stale={staleIds.includes(model.id)}
                    tierNames={tierNames}
                  />
                </span>
                <span className="hidden text-right text-sm tabular-nums text-gray-12 md:block">
                  {contextOf(model)}
                </span>
                <span className="hidden text-right text-sm tabular-nums text-gray-12 md:block">
                  {priceOf(model)}
                </span>
                <span className="hidden md:block">
                  <ModelCapabilityIcons
                    provider={config.provider}
                    metadata={model.metadata}
                    modelType={model.type}
                  />
                </span>
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

function BulkButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="basic"
      size="xs"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function FilterToggle({
  icon: Icon,
  label,
  pressed,
  onPressedChange,
}: {
  icon: LucideIcon;
  label: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}) {
  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={pressed}
      onPressedChange={onPressedChange}
      className="px-2.5 text-xs text-gray-12 data-[state=on]:border-gray-8"
    >
      <Icon className="size-3.5 text-gray-11" />
      {label}
    </Toggle>
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
        <span className="hidden truncate font-mono text-xs text-gray-11 sm:inline">
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

function contextOf(model: AIProviderModel): string {
  const tokens = model.metadata?.contextTokens;
  return tokens === undefined ? EMPTY : modelMeta.formatContext({ tokens });
}

function priceOf(model: AIProviderModel): string {
  const input = model.metadata?.inputCostPerMillionTokens;
  const output = model.metadata?.outputCostPerMillionTokens;
  if (input === undefined || output === undefined) {
    return EMPTY;
  }
  return `${modelMeta.formatPrice({
    perMillion: input,
  })} / ${modelMeta.formatPrice({ perMillion: output })}`;
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

const EMPTY = '—';

const ROW_GRID =
  'grid grid-cols-[1rem_minmax(0,1fr)] items-center gap-x-3 px-4 md:grid-cols-[1rem_minmax(0,1fr)_4rem_7.5rem_6rem]';

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
  selection: KeyModelSelection;
  isLoading: boolean;
  onChange: (selection: KeyModelSelection) => void;
};
