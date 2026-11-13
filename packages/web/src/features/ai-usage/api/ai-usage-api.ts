import {
  AiUsageDetail,
  AiUsageDimension,
  AiUsageItemList,
  AiUsageOverview,
  AiUsagePeriod,
  AiUsageScope,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const aiUsageApi = {
  getOverview({
    period,
    scope,
  }: {
    period: AiUsagePeriod;
    scope: AiUsageScope;
  }): Promise<AiUsageOverview> {
    return api.get<AiUsageOverview>('/v1/ai-usage/overview', {
      period,
      scope,
    });
  },
  getItems({
    dimension,
    period,
    scope,
  }: {
    dimension: AiUsageDimension;
    period: AiUsagePeriod;
    scope: AiUsageScope;
  }): Promise<AiUsageItemList> {
    return api.get<AiUsageItemList>('/v1/ai-usage/items', {
      dimension,
      period,
      scope,
    });
  },
  getDetail({
    dimension,
    id,
    period,
    scope,
  }: {
    dimension: AiUsageDimension;
    id: string;
    period: AiUsagePeriod;
    scope: AiUsageScope;
  }): Promise<AiUsageDetail> {
    return api.get<AiUsageDetail>(`/v1/ai-usage/items/${dimension}/${id}`, {
      period,
      scope,
    });
  },
};
