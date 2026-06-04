import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenProject, wistiaApiCall, WistiaProject } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof wistiaAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await wistiaApiCall<WistiaProject[]>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      resourceUrl: '/projects.json',
      query: {
        per_page: 100,
        sort_by: 'created',
        sort_direction: 0,
      },
    });
    return response.body.map((project) => ({
      epochMilliSeconds: new Date(project.created ?? 0).getTime(),
      data: flattenProject(project),
    }));
  },
};

export const newProjectTrigger = createTrigger({
  auth: wistiaAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created in your account.',
  props: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 215140,
    hashed_id: 'xy12ab34cd',
    name: 'Marketing Videos',
    description: 'All our marketing content.',
    media_count: 12,
    public: false,
    public_id: 'xy12ab34cd',
    anonymous_can_upload: false,
    anonymous_can_download: false,
    created: '2024-01-10T09:00:00.000Z',
    updated: '2024-01-15T10:35:00.000Z',
  },
});
