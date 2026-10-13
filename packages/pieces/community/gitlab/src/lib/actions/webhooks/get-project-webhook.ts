import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { hookOutputSchema } from '../../output-schemas-admin';
import { withoutToken } from './create-project-webhook';

export const getProjectWebhookAction = createAction({
  auth: gitlabAuth,
  name: 'get_project_webhook',
  displayName: 'Get Project Webhook',
  description: 'Gets one project webhook with its URL and events.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one GitLab project webhook by numeric ID: URL, name, which events it fires on, branch filter and SSL verification. The secret token is never returned. Requires Maintainer role.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    hookId: adminProps.hookId(),
  },
  outputSchema: hookOutputSchema,
  async run({ auth, propsValue }) {
    const hookId = requirePositiveInt({ value: propsValue.hookId, label: 'Webhook ID' });
    return withoutToken(await gitlabRequest({ auth,  method: 'GET', path: `${projectPath(propsValue.projectId)}/hooks/${hookId}` }));
  },
});
