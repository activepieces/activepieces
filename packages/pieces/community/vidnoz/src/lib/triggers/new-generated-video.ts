import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  StaticPropsValue,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

import { vidnozAuth } from '../..';
import { vidnozClient } from '../common/auth';

type VidnozVideo = {
  id: string;
  name: string;
  status: number;
  create_at: string;
  file_720p?: {
    size: number;
    duration: number;
    url: string;
  };
  file_1080p?: {
    size: number;
    duration: number;
    url: string;
  };
};

type VidnozVideoListResponse = {
  code: number;
  message: string;
  data?: {
    total: number;
    end_cursor?: string;
    videos?: VidnozVideo[];
  };
};

const props = {
  limit: Property.Number({
    displayName: 'Limit',
    required: false,
    defaultValue: 100,
  }),
  status: Property.StaticDropdown({
    displayName: 'Video Status',
    required: false,
    defaultValue: 1,
    options: {
      options: [
        { label: 'Generated', value: 1 },
        { label: 'Generating', value: 2 },
        { label: 'Generating failed', value: 3 },
        { label: 'Draft only', value: 0 },
      ],
    },
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof vidnozAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const limit = propsValue.limit ?? 100;
    const response = await vidnozClient.makeRequest<VidnozVideoListResponse>(
      auth.secret_text,
      {
        method: HttpMethod.GET,
        url: '/v2/video/list',
        queryParams: {
          limit: String(limit),
        },
      }
    );

    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to fetch videos');
    }

    const statusFilter = propsValue.status;
    const videos = (response.data?.videos ?? [])
      .filter((v) => (statusFilter === undefined ? true : v.status === statusFilter))
      .slice();

    videos.sort((a, b) => {
      const aTime = Date.parse(a.create_at) || 0;
      const bTime = Date.parse(b.create_at) || 0;
      return bTime - aTime;
    });

    return videos.map((video) => ({
      id: video.id,
      data: video,
    }));
  },
};

export const newGeneratedVideo = createTrigger({
  auth: vidnozAuth,
  name: 'new_generated_video',
  displayName: 'New Generated Video',
  description: 'Triggers when a new generated video appears in your Vidnoz account.',
  props,
  sampleData: {
    id: 'WGdtdHJDMmpueG1ZazM0OVlQQys2QT09',
    name: 'Video name',
    status: 1,
    create_at: '2024-09-06 03:10:28',
    file_720p: {
      size: 10258541,
      duration: 6.58,
      url: 'https://example.com/video-720p.mp4',
    },
    file_1080p: {
      size: 52125432,
      duration: 6.58,
      url: 'https://example.com/video-1080p.mp4',
    },
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
