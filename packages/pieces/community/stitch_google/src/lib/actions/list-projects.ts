import { createAction } from '@activepieces/pieces-framework';
import { stitchGoogleAuth } from '../auth';
import { stitchClient, extractApiKey } from '../common';

export const listProjectsAction = createAction({
  auth: stitchGoogleAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'Retrieve all Stitch projects accessible with your API key.',
  props: {},
  async run(context) {
    const apiKey = extractApiKey(context.auth);
    const result = await stitchClient.callStitchTool<StitchProjectListResult>(
      apiKey,
      'list_projects',
      {}
    );
    return flattenProjects(result);
  },
});

function flattenProjects(result: StitchProjectListResult) {
  if (!result?.projects) return [];
  return result.projects.map((p) => ({
    project_id: p.projectId ?? p.id,
    title: p.title,
    created_time: p.createTime,
    updated_time: p.updateTime,
  }));
}

type StitchProject = {
  id: string;
  projectId: string;
  title: string;
  createTime: string;
  updateTime: string;
};

type StitchProjectListResult = {
  projects: StitchProject[];
};
