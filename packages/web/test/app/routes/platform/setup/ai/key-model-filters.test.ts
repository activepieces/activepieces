import { AIProviderModel, AIProviderModelType } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { keyModelFilters } from '@/app/routes/platform/setup/ai/providers-tab/key-model-filters';

const model = (
  id: string,
  metadata: AIProviderModel['metadata'] = {},
  type: AIProviderModelType = AIProviderModelType.TEXT,
): AIProviderModel => ({ id, name: id.toUpperCase(), type, metadata });

const MODELS: AIProviderModel[] = [
  model('old-cheap', {
    releaseDate: '2024-01',
    inputCostPerMillionTokens: 0.1,
    contextTokens: 8000,
    supportsToolCalling: true,
  }),
  model('new-pricey', {
    releaseDate: '2026-05-01',
    inputCostPerMillionTokens: 15,
    contextTokens: 1000000,
    supportsToolCalling: true,
    supportsReasoning: true,
  }),
  model('no-meta', undefined),
  model('painter', {}, AIProviderModelType.IMAGE),
];

const ids = (models: AIProviderModel[]) => models.map((entry) => entry.id);

const base = {
  models: MODELS,
  search: '',
  capabilities: [],
  sort: 'name' as const,
  selectedOnly: false,
  selectedIds: [],
};

describe('keyModelFilters.apply', () => {
  it('matches the search on the model id, not only the name', () => {
    expect(ids(keyModelFilters.apply({ ...base, search: 'pricey' }))).toEqual([
      'new-pricey',
    ]);
  });

  it('keeps only models with every chosen capability', () => {
    expect(
      ids(
        keyModelFilters.apply({
          ...base,
          capabilities: ['toolCalling', 'reasoning'],
        }),
      ),
    ).toEqual(['new-pricey']);
    expect(
      ids(keyModelFilters.apply({ ...base, capabilities: ['image'] })),
    ).toEqual(['painter']);
  });

  it('sorts newest first, mixed date formats, missing values last', () => {
    expect(ids(keyModelFilters.apply({ ...base, sort: 'newest' }))).toEqual([
      'new-pricey',
      'old-cheap',
      'no-meta',
      'painter',
    ]);
  });

  it('sorts cheapest first and biggest context first', () => {
    expect(
      ids(keyModelFilters.apply({ ...base, sort: 'cheapest' })).slice(0, 2),
    ).toEqual(['old-cheap', 'new-pricey']);
    expect(
      ids(keyModelFilters.apply({ ...base, sort: 'context' })).slice(0, 2),
    ).toEqual(['new-pricey', 'old-cheap']);
  });

  it('shows only selected models when asked', () => {
    expect(
      ids(
        keyModelFilters.apply({
          ...base,
          selectedOnly: true,
          selectedIds: ['painter', 'old-cheap'],
        }),
      ),
    ).toEqual(['old-cheap', 'painter']);
  });
});
