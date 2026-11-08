import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps } from '../../common/props';
import { projectLanguagesOutputSchema } from '../../output-schemas-admin';

export const getProjectLanguagesAction = createAction({
  auth: gitlabAuth,
  name: 'get_project_languages',
  displayName: 'Get Project Languages',
  description: 'Gets the programming languages of a project repository with their share.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the programming languages detected in a GitLab project repository with the percentage of code in each, largest first. Empty for an empty repository.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
  },
  outputSchema: projectLanguagesOutputSchema,
  async run({ auth, propsValue }) {
    const body = await gitlabRequest<Record<string, number> | undefined>({ auth,  method: 'GET', path: `${projectPath(propsValue.projectId)}/languages` });
    const languages = Object.entries(body ?? {})
      .map(([language, percentage]) => ({ language, percentage: Number(percentage) }))
      .sort((a, b) => b.percentage - a.percentage);
    return { languages, count: languages.length };
  },
});
