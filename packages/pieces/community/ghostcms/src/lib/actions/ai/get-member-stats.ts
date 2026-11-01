import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostClient } from '../../common/client';
import { ghostMemberStatsOutputSchema } from '../../output-schemas';

type MemberCount = {
  date: string;
  paid: number;
  free: number;
  comped: number;
  gift?: number;
};

export const ghostGetMemberStats = createAction({
  auth: ghostAuth,
  name: 'ghost_get_member_stats',
  outputSchema: ghostMemberStatsOutputSchema,
  classification: 'READ',
  displayName: 'Get Member Stats',
  description: 'Get the current member totals (free, paid, comped) and the daily history.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns how many members the publication has right now, split into free, paid, comped and gift, plus one row per day with the counts on that day. Use it to answer growth questions; use List Members to see who the members are.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await ghostClient.request<{ total?: number; data?: MemberCount[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/members/stats/count',
    });
    const history = (response.data ?? []).map((day) => ({
      date: day.date,
      free: day.free ?? 0,
      paid: day.paid ?? 0,
      comped: day.comped ?? 0,
      gift: day.gift ?? 0,
    }));
    const latest = history[history.length - 1];
    return {
      total: response.total ?? 0,
      free: latest?.free ?? 0,
      paid: latest?.paid ?? 0,
      comped: latest?.comped ?? 0,
      gift: latest?.gift ?? 0,
      as_of: latest?.date ?? null,
      history,
    };
  },
});
