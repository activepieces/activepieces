import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, pagingInput } from '../../common/props';
import { hookListOutputSchema } from '../../output-schemas-admin';
import { withoutToken } from './create-project-webhook';

export const listProjectWebhooksAction = createAction({
  auth: gitlabAuth,
  name: 'list_project_webhooks',
  displayName: 'List Project Webhooks',
  description: 'Lists the webhooks of a project.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the webhooks of a GitLab project with their URL and enabled events (secret tokens are never returned), including the ones Activepieces triggers created. Returns one page plus nextPage/hasMore. Requires Maintainer role.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: hookListOutputSchema,
  async run({ auth, propsValue }) {
    const result = await gitlabListPage<unknown>({ auth, 
      path: `${projectPath(propsValue.projectId)}/hooks`,
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
    return { ...result, items: result.items.map((hook) => withoutToken(hook)) };
  },
});
