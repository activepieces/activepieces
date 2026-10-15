import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { deletedHookOutputSchema } from '../../output-schemas-admin';

export const deleteProjectWebhookAction = createAction({
  auth: gitlabAuth,
  name: 'delete_project_webhook',
  displayName: 'Delete Project Webhook',
  description: 'Permanently deletes a project webhook.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a GitLab project webhook so its URL stops receiving events; it cannot be restored. Deleting a webhook created by an Activepieces trigger breaks that trigger until it is re-enabled, so check the URL with Get Project Webhook first. A second call fails with not found. Requires Maintainer role.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    hookId: adminProps.hookId(),
  },
  outputSchema: deletedHookOutputSchema,
  async run({ auth, propsValue }) {
    const hookId = requirePositiveInt({ value: propsValue.hookId, label: 'Webhook ID' });
    await gitlabRequest({ auth,  method: 'DELETE', path: `${projectPath(propsValue.projectId)}/hooks/${hookId}` });
    return { deleted: true, hookId };
  },
});
