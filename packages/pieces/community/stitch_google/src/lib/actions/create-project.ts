import { createAction, Property } from '@activepieces/pieces-framework';
import { stitchGoogleAuth } from '../auth';
import { stitchClient, extractApiKey } from '../common';

export const createProjectAction = createAction({
  auth: stitchGoogleAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new Stitch project to hold your generated screens.',
  props: {
    title: Property.ShortText({
      displayName: 'Project Title',
      description: 'A descriptive name for your new project (e.g. "Mobile Banking App").',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = extractApiKey(context.auth);
    const { title } = context.propsValue;
    const result = await stitchClient.callStitchTool<StitchProjectResult>(
      apiKey,
      'create_project',
      { title }
    );
    return {
      project_id: result.projectId ?? result.id,
      title: result.title,
      created_time: result.createTime,
      updated_time: result.updateTime,
    };
  },
});

type StitchProjectResult = {
  id: string;
  projectId: string;
  title: string;
  createTime: string;
  updateTime: string;
};
