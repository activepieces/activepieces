import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../../index';
import { ccRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

type Job = { id: string; status?: string; created_at?: string; updated_at?: string };

export const cloudconvertNewJobEvent = createTrigger({
  auth: cloudconvertAuth,
  name: 'cloudconvert_new_job_event',
  displayName: 'New Job Event',
  description: 'Fires when CloudConvert has a new/updated job',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: { id: 'job-id', status: 'finished' },
  onEnable: async (ctx) => {
    await ctx.store.put('cc_last_ts', new Date().toISOString());
  },
  onDisable: async (ctx) => {
    await ctx.store.delete('cc_last_ts');
  },
  run: async (ctx) => {
    const token = ctx.auth as string;
    const lastTs = (await ctx.store.get<string>('cc_last_ts')) ?? new Date(0).toISOString();
    const res = await ccRequest<{ data?: Job[] }>(token, HttpMethod.GET, '/jobs?per_page=100');
    const list = (res.body?.data ?? []) as Job[];
    const out: Job[] = [];
    let maxTs = lastTs;
    for (const j of list) {
      const ts = j.updated_at || j.created_at || new Date().toISOString();
      if (ts > lastTs) out.push(j);
      if (ts > maxTs) maxTs = ts;
    }
    await ctx.store.put('cc_last_ts', maxTs);
    return out;
  },
});

