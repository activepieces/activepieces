import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { NiftyAuth, niftyClient, NiftyRecord } from '../common/client';
import { IdState, niftyPolling } from '../common/polling';
import { projectOutputSchema } from '../output-schemas';
import { PROJECT_SAMPLE } from './sample-data';

export const newProject = createTrigger({
  auth: niftyAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project appears in your Nifty workspace.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per Nifty project that newly appears in the list the connection can see, optionally only in one portfolio, including projects you are newly added to. Projects that already existed when the flow was turned on do not fire.',
  },
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
  },
  outputSchema: projectOutputSchema,
  sampleData: PROJECT_SAMPLE,
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const fp = fingerprintOf({ portfolio: context.propsValue.portfolio });
    const stored = niftyPolling.readIdState({ value: await context.store.get<unknown>(KNOWN_KEY), fp });
    if (context.isRepublish && stored) {
      return;
    }
    await context.store.put(KNOWN_KEY, await seed({ auth: context.auth, portfolio: context.propsValue.portfolio }));
  },
  async onDisable() {
    return;
  },
  async test(context) {
    const { items } = await fetchProjects({ auth: context.auth, portfolio: context.propsValue.portfolio });
    return items.slice(-5).reverse();
  },
  async run(context) {
    const fp = fingerprintOf({ portfolio: context.propsValue.portfolio });
    const stored = niftyPolling.readIdState({ value: await context.store.get<unknown>(KNOWN_KEY), fp });
    if (!stored) {
      await context.store.put(KNOWN_KEY, await seed({ auth: context.auth, portfolio: context.propsValue.portfolio }));
      return [];
    }
    const { items, truncated } = await fetchProjects({ auth: context.auth, portfolio: context.propsValue.portfolio });
    const result = niftyPolling.advanceIdSet({ known: stored.known, dropped: stored.dropped, items, truncated });
    const next: IdState = { fp, known: result.known, dropped: result.dropped };
    await context.store.put(KNOWN_KEY, next);
    return result.emit;
  },
});

async function seed({ auth, portfolio }: { auth: NiftyAuth; portfolio: string | undefined }): Promise<IdState> {
  const { items } = await fetchProjects({ auth, portfolio });
  return {
    fp: fingerprintOf({ portfolio }),
    known: items.map((p) => niftyClient.text({ record: p, key: 'id' })).filter((id) => id.length > 0),
    dropped: [],
  };
}

async function fetchProjects({
  auth,
  portfolio,
}: {
  auth: NiftyAuth;
  portfolio: string | undefined;
}): Promise<{ items: NiftyRecord[]; truncated: boolean }> {
  const portfolioId = niftyClient.optionalId({ value: portfolio, label: 'Portfolio' });
  const { items, truncated } = await niftyClient.listAll({ auth, path: 'projects', key: 'projects', query: { subteam_id: portfolioId } });
  return {
    items: items
      .filter((project) => portfolioId === undefined || niftyClient.text({ record: project, key: 'subteam' }) === portfolioId)
      .map(niftyClient.cleanProject),
    truncated,
  };
}

function fingerprintOf({ portfolio }: { portfolio: string | undefined }): string {
  return niftyPolling.fingerprint({ values: [niftyClient.optionalId({ value: portfolio, label: 'Portfolio' }) ?? null] });
}

const KNOWN_KEY = 'nifty_new_project_known_ids';
