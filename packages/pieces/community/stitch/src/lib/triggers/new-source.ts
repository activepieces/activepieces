import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, StitchSource } from '../common';

type StitchAuthValue = {
  connect_api_token: string;
  import_api_token: string;
  client_id: string;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof stitchAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const a = auth as unknown as StitchAuthValue;
    const sources = await makeConnectRequest<StitchSource[]>(
      a,
      HttpMethod.GET,
      '/v4/sources'
    );
    return sources
      .filter((s) => !s.deleted_at)
      .map((s) => ({
        epochMilliSeconds: new Date(s.created_at).getTime(),
        data: {
          id: s.id,
          display_name: s.display_name,
          type: s.type,
          stitch_client_id: s.stitch_client_id,
          created_at: s.created_at,
          updated_at: s.updated_at,
          deleted_at: s.deleted_at,
          paused_at: s.paused_at,
          system_paused: s.system_paused,
        },
      }));
  },
};

export const newSourceTrigger = createTrigger({
  auth: stitchAuth,
  name: 'new_source',
  displayName: 'New Source',
  description: 'Triggers when a new data source is connected to your Stitch account.',
  props: {},
  sampleData: {
    id: 12345,
    display_name: 'Production Salesforce',
    type: 'salesforce',
    stitch_client_id: 67890,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    deleted_at: null,
    paused_at: null,
    system_paused: null,
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
