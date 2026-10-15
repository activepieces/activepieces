import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { weincRequest, WeincProject } from '../common/client';

const polling: Polling<AppConnectionValueForAuthProperty<typeof weincAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    // The API returns projects newest first; 100 is its page maximum.
    const res = await weincRequest<{ projects: WeincProject[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/projects',
      queryParams: { limit: '100' },
    });
    return res.projects.map((project) => ({
      epochMilliSeconds: Date.parse(project.created_at),
      data: project,
    }));
  },
};

export const newProject = createTrigger({
  auth: weincAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created in your organization.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires for each WeInc project created in the organization since the last check, polling on the project creation time.',
  },
  props: {},
  sampleData: {
    id: '7b0c1d2e-3f40-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Bayview Dental',
    description: 'Website for a family dental clinic',
    status: 'active',
    org_client_id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    published_url: null,
    custom_domain: null,
    last_published_at: null,
    created_at: '2026-10-16T09:30:00.000Z',
    updated_at: '2026-10-16T09:30:00.000Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
