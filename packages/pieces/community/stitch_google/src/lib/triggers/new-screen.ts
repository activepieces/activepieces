import {
  createTrigger,
  Property,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { stitchGoogleAuth } from '../auth';
import { stitchClient, extractApiKey } from '../common';

const poll: Polling<AppConnectionValueForAuthProperty<typeof stitchGoogleAuth>, { project_id: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  async items({ auth, propsValue }) {
    const apiKey = extractApiKey(auth);
    const { project_id } = propsValue;

    const result = await stitchClient.callStitchTool<StitchScreenListResult>(
      apiKey,
      'list_screens',
      { projectId: project_id }
    );

    if (!result?.screens) return [];

    return result.screens.map((s) => ({
      id: s.screenId ?? s.id,
      data: {
        screen_id: s.screenId ?? s.id,
        project_id: s.projectId ?? project_id,
        display_name: s.displayName,
        device_type: s.deviceType,
        html_url: s.htmlUrl,
        image_url: s.imageUrl,
        created_time: s.createTime,
        updated_time: s.updateTime,
      },
    }));
  },
};

export const newScreenTrigger = createTrigger({
  auth: stitchGoogleAuth,
  name: 'new_screen',
  displayName: 'New Screen Generated',
  description: 'Triggers whenever a new screen is generated in the specified Stitch project.',
  type: TriggerStrategy.POLLING,
  sampleData: {
    screen_id: '1234567890',
    project_id: '9876543210',
    display_name: 'Login Page',
    device_type: 'MOBILE',
    html_url: 'https://storage.googleapis.com/stitch-screens/screen.html',
    image_url: 'https://storage.googleapis.com/stitch-screens/screen.png',
    created_time: '2024-01-01T00:00:00Z',
    updated_time: '2024-01-01T00:00:00Z',
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project to watch for new screens. Find it in your Stitch dashboard URL or from the "List Projects" action.',
      required: true,
    }),
  },
  async onEnable(context) {
    await pollingHelper.onEnable(poll, { store: context.store, auth: context.auth, propsValue: context.propsValue });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(poll, { store: context.store, auth: context.auth, propsValue: context.propsValue });
  },
  async run(context) {
    return pollingHelper.poll(poll, { store: context.store, auth: context.auth, propsValue: context.propsValue, files: context.files });
  },
  async test(context) {
    return pollingHelper.test(poll, { store: context.store, auth: context.auth, propsValue: context.propsValue, files: context.files });
  },
});

type StitchScreen = {
  id: string;
  screenId: string;
  projectId: string;
  displayName: string;
  deviceType: string;
  htmlUrl: string;
  imageUrl: string;
  createTime: string;
  updateTime: string;
};

type StitchScreenListResult = {
  screens: StitchScreen[];
};
