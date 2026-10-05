import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { NiftyAuth, niftyClient, NiftyRecord } from '../common/client';
import { niftyPolling } from '../common/polling';
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
    if (context.isRepublish && (await context.store.get<string[]>(KNOWN_KEY))) {
      return;
    }
    const projects = await fetchProjects({ auth: context.auth, portfolio: context.propsValue.portfolio });
    await context.store.put(KNOWN_KEY, projects.map((p) => niftyClient.text({ record: p, key: 'id' })));
  },
  async onDisable(context) {
    await context.store.delete(KNOWN_KEY);
  },
  async test(context) {
    const projects = await fetchProjects({ auth: context.auth, portfolio: context.propsValue.portfolio });
    return projects.slice(-5).reverse();
  },
  async run(context) {
    const projects = await fetchProjects({ auth: context.auth, portfolio: context.propsValue.portfolio });
    const known = await context.store.get<string[]>(KNOWN_KEY);
    if (!known) {
      await context.store.put(KNOWN_KEY, projects.map((p) => niftyClient.text({ record: p, key: 'id' })));
      return [];
    }
    const result = niftyPolling.advanceIdSet({ known, items: projects });
    await context.store.put(KNOWN_KEY, result.known);
    return result.emit;
  },
});

async function fetchProjects({ auth, portfolio }: { auth: NiftyAuth; portfolio: string | undefined }): Promise<NiftyRecord[]> {
  const portfolioId = niftyClient.optionalId({ value: portfolio, label: 'Portfolio' });
  const { items } = await niftyClient.listAll({ auth, path: 'projects', key: 'projects', query: { subteam_id: portfolioId } });
  return items
    .filter((project) => portfolioId === undefined || niftyClient.text({ record: project, key: 'subteam' }) === portfolioId)
    .map(niftyClient.cleanProject);
}

const KNOWN_KEY = 'nifty_new_project_known_ids';
