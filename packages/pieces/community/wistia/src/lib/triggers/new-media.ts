import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenMedia, wistiaApiCall, wistiaCommon, WistiaMedia } from '../common';

const props = {
  projectId: wistiaCommon.projectIdDropdown(false),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof wistiaAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const response = await wistiaApiCall<WistiaMedia[]>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      resourceUrl: '/medias.json',
      query: {
        project_id: propsValue.projectId,
        per_page: 100,
        sort_by: 'created',
        sort_direction: 0,
      },
    });
    return response.body.map((media) => ({
      epochMilliSeconds: new Date(media.created ?? 0).getTime(),
      data: flattenMedia(media),
    }));
  },
};

export const newMediaTrigger = createTrigger({
  auth: wistiaAuth,
  name: 'new_media',
  displayName: 'New Media',
  description: 'Triggers when a new video or media file is added to your account.',
  props,
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
    id: 6122606,
    hashed_id: 'abc123def4',
    name: 'My Awesome Video',
    type: 'Video',
    status: 'ready',
    progress: 1,
    section: null,
    description: 'A short description of the video.',
    duration: 42.13,
    created: '2024-01-15T10:30:00.000Z',
    updated: '2024-01-15T10:35:00.000Z',
    thumbnail_url: 'https://embed-ssl.wistia.com/deliveries/abc123.jpg',
    thumbnail_width: 1280,
    thumbnail_height: 720,
    project_id: 215140,
    project_name: 'Marketing Videos',
    project_hashed_id: 'xy12ab34cd',
  },
});
