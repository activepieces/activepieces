import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { PromptHubClient } from '../common/client';
import { listProjectsProps, listProjectsSchema } from '../common/props';

export const listProjects = createAction({
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'List PromptHub projects for a team. Returns information about each project\'s head revision and groups.',
  props: listProjectsProps,
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, listProjectsSchema);
    const client = new PromptHubClient(auth as string);
    const result = await client.listProjects(propsValue['teamId'], {
      group: propsValue['group'],
      model: propsValue['model'],
      provider: propsValue['provider'],
    });
    
    const data = result?.data ?? result;
    return Array.isArray(data)
      ? data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          head: p.head ? {
            provider: p.head.provider,
            model: p.head.model,
            prompt: p.head.prompt,
            system_message: p.head.system_message,
            formatted_request: p.head.formatted_request,
            hash: p.head.hash,
            commit_title: p.head.commit_title,
            commit_description: p.head.commit_description,
            variables: p.head.variables,
            branch: p.head.branch,
            configuration: p.head.configuration,
          } : null,
          groups: p.groups || [],
        }))
      : data;
  },
});


