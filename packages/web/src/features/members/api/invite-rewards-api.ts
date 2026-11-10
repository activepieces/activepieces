import { InviteRewardSummary } from '@activepieces/shared';

import { api } from '../../../lib/api';

export const inviteRewardsApi = {
  getSummary: () => api.get<InviteRewardSummary>('/v1/invite-rewards'),
};
