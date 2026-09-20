import {
  ACTIVEPIECES_CHAT_TIERS,
  DEFAULT_CHAT_TIER_ID,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

const BUNDLED_TIERS: ChatTiersResponse = {
  tiers: ACTIVEPIECES_CHAT_TIERS.map((tier) => ({
    id: tier.id,
    label: tier.label,
    modelId: tier.modelId,
  })),
  defaultTierId: DEFAULT_CHAT_TIER_ID,
};

export function useChatTiers(): ChatTiersResponse {
  const { data } = useQuery({
    queryKey: ['ai-provider-tiers'],
    queryFn: () => api.get<ChatTiersResponse>('/v1/ai-providers/tiers'),
    staleTime: 60 * 60 * 1000,
  });
  return data ?? BUNDLED_TIERS;
}

export type ChatTier = {
  id: string;
  label: string;
  modelId: string;
};

export type ChatTiersResponse = {
  tiers: ChatTier[];
  defaultTierId: string;
};
