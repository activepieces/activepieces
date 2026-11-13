import { AIProviderModel, AIProviderModelType } from '@activepieces/shared';

function apply({
  models,
  search,
  capabilities,
  sort,
  selectedOnly,
  selectedIds,
}: {
  models: AIProviderModel[];
  search: string;
  capabilities: ModelCapabilityFilter[];
  sort: ModelSort;
  selectedOnly: boolean;
  selectedIds: string[];
}): AIProviderModel[] {
  const needle = search.trim().toLowerCase();
  return models
    .filter(
      (model) =>
        needle === '' ||
        model.name.toLowerCase().includes(needle) ||
        model.id.toLowerCase().includes(needle),
    )
    .filter((model) =>
      capabilities.every((capability) => hasCapability({ model, capability })),
    )
    .filter((model) => !selectedOnly || selectedIds.includes(model.id))
    .sort((a, b) => compareModels({ a, b, sort }));
}

function hasCapability({
  model,
  capability,
}: {
  model: AIProviderModel;
  capability: ModelCapabilityFilter;
}): boolean {
  switch (capability) {
    case 'toolCalling':
      return model.metadata?.supportsToolCalling === true;
    case 'reasoning':
      return model.metadata?.supportsReasoning === true;
    case 'vision':
      return model.metadata?.supportsVision === true;
    case 'image':
      return model.type === AIProviderModelType.IMAGE;
  }
}

function compareModels({
  a,
  b,
  sort,
}: {
  a: AIProviderModel;
  b: AIProviderModel;
  sort: ModelSort;
}): number {
  const left = sortValueOf({ model: a, sort });
  const right = sortValueOf({ model: b, sort });
  if (left === right) {
    return a.name.localeCompare(b.name);
  }
  if (left === undefined) {
    return 1;
  }
  if (right === undefined) {
    return -1;
  }
  return (left < right ? -1 : 1) * SORT_DIRECTION[sort];
}

function sortValueOf({
  model,
  sort,
}: {
  model: AIProviderModel;
  sort: ModelSort;
}): string | number | undefined {
  switch (sort) {
    case 'newest':
      return model.metadata?.releaseDate;
    case 'cheapest':
      return model.metadata?.inputCostPerMillionTokens;
    case 'context':
      return model.metadata?.contextTokens;
    case 'name':
      return model.name.toLowerCase();
  }
}

const SORT_DIRECTION: Record<ModelSort, 1 | -1> = {
  newest: -1,
  cheapest: 1,
  context: -1,
  name: 1,
};

export const keyModelFilters = { apply };

export type ModelCapabilityFilter =
  | 'toolCalling'
  | 'reasoning'
  | 'vision'
  | 'image';

export type ModelSort = 'newest' | 'cheapest' | 'context' | 'name';
