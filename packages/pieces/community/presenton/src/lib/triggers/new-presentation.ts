import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { presentonAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof presentonAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const apiKey = auth.secret_text;

    const response: any = await makeRequest(
      apiKey,
      HttpMethod.GET,
      '/ppt/presentation/all'
    );

    const itemsArray = response.results;

    return itemsArray.map((item: any) => ({
      epochMilliSeconds: dayjs(item.created_at).valueOf(),
      data: item,
    }));
  },
};

export const newPresentation = createTrigger({
  auth: presentonAuth,
  name: 'newPresentation',
  displayName: 'New Presentation',
  description: 'Triggers when a new presentation is created in Presenton.',
  props: {},
  sampleData: {
    id: '93d4092b-2a20-4637-bbe7-2addb6273761',
    user: 'fa86a74f-53b9-46fa-9ac9-e3a526d125ca',
    content: 'Indian society ',
    n_slides: 1,
    language: 'English',
    title: ' AI   **Presented by:** Jon deo -',
    created_at: '2025-11-11T11:33:55.269027Z',
    updated_at: '2025-11-11T11:34:12.978847Z',
    tone: 'default',
    verbosity: 'standard',
    theme: null,
    slides: [
      {
        presentation: '93d4092b-2a20-4637-bbe7-2addb6273761',
        layout: 'general:general-intro-slide',
        index: 0,
        layout_group: 'general',
        speaker_note: '',
        id: '38ca1626-83ef-451f-8529-8b10725bcb3f',
        content: {
          title: 'AI Presentation',
          description: '',
          presenterName: 'Jon Deo',
          presentationDate: '2025-11-11',
          image: {
            __image_prompt__: 'r',
            __image_url__:
              'https://images.pexels.com/photos/17898879/pexels-photo-17898879.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
          },
          __speaker_note__: '',
        },
        html_content: null,
        properties: null,
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
