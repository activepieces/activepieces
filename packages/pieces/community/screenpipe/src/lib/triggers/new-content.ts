import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../auth';
import { screenpipeApiRequest } from '../common';

interface ScreenpipeSearchResponse {
  data: Array<{
    type: string;
    content: Record<string, unknown>;
  }>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const newContent = createTrigger({
  auth: screenpipeAuth,
  name: 'new_content',
  displayName: 'New Content Captured',
  description:
    'Triggers when Screenpipe captures new screen or audio content',
  props: {},
  sampleData: {
    type: 'OCR',
    content: {
      frame_id: 12345,
      text: 'Sample captured text from screen',
      timestamp: '2026-03-05T10:30:00Z',
      app_name: 'Firefox',
      window_name: 'GitHub',
      tags: [],
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put(
      'lastPollTime',
      new Date().toISOString()
    );
  },
  async onDisable(context) {
    await context.store.delete('lastPollTime');
  },
  async run(context) {
    const lastPollTime =
      (await context.store.get<string>('lastPollTime')) ??
      new Date(0).toISOString();

    const response =
      await screenpipeApiRequest<ScreenpipeSearchResponse>({
        auth: context.auth,
        method: HttpMethod.GET,
        endpoint: '/search',
        queryParams: {
          start_time: lastPollTime,
          limit: '50',
          content_type: 'all',
        },
      });

    await context.store.put(
      'lastPollTime',
      new Date().toISOString()
    );

    return response.data ?? [];
  },
  async test(context) {
    const response =
      await screenpipeApiRequest<ScreenpipeSearchResponse>({
        auth: context.auth,
        method: HttpMethod.GET,
        endpoint: '/search',
        queryParams: {
          limit: '5',
          content_type: 'all',
        },
      });

    return response.data ?? [];
  },
});
