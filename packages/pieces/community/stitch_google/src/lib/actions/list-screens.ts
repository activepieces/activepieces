import { createAction, Property } from '@activepieces/pieces-framework';
import { stitchGoogleAuth } from '../auth';
import { stitchClient, extractApiKey } from '../common';

export const listScreensAction = createAction({
  auth: stitchGoogleAuth,
  name: 'list_screens',
  displayName: 'List Screens',
  description: 'List all screens in a specific Stitch project.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project whose screens you want to list. Find it in your Stitch dashboard URL or from the "List Projects" action.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = extractApiKey(context.auth);
    const { project_id } = context.propsValue;
    const result = await stitchClient.callStitchTool<StitchScreenListResult>(
      apiKey,
      'list_screens',
      { projectId: project_id }
    );
    return flattenScreens(result, project_id);
  },
});

function flattenScreens(result: StitchScreenListResult, projectId: string) {
  if (!result?.screens) return [];
  return result.screens.map((s) => ({
    screen_id: s.screenId ?? s.id,
    project_id: s.projectId ?? projectId,
    display_name: s.displayName,
    device_type: s.deviceType,
    created_time: s.createTime,
    updated_time: s.updateTime,
  }));
}

type StitchScreen = {
  id: string;
  screenId: string;
  projectId: string;
  displayName: string;
  deviceType: string;
  createTime: string;
  updateTime: string;
};

type StitchScreenListResult = {
  screens: StitchScreen[];
};
