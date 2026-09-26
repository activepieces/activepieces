import {
  ACTIVEPIECES_CHAT_TIERS,
  DEFAULT_CHAT_TIER_ID,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

const BUNDLED_TIERS: ModelTiersResponse = {
  tiers: ACTIVEPIECES_CHAT_TIERS.map((tier) => ({
    id: tier.id,
    label: tier.label,
    modelId: tier.modelId,
  })),
  defaultTierId: DEFAULT_CHAT_TIER_ID,
};

export function useModelTiers(): ModelTiersResponse {
  const { data } = useQuery({
    queryKey: ['ai-provider-tiers'],
    queryFn: () => api.get<ModelTiersResponse>('/v1/ai-providers/tiers'),
    staleTime: 60 * 60 * 1000,
  });
  return data ?? BUNDLED_TIERS;
}

export type ModelTier = {
  id: string;
  label: string;
  modelId: string;
};

export type ModelTiersResponse = {
  tiers: ModelTier[];
  defaultTierId: string;
};
