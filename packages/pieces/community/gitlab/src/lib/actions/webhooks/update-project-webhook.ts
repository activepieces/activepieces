import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { hookOutputSchema } from '../../output-schemas-admin';
import { hookBody, hookCommonProps, hookEventProps, requireHookUrl, withoutToken } from './create-project-webhook';

const CLEARABLE_FIELDS = ['description', 'push_events_branch_filter'];

export const updateProjectWebhookAction = createAction({
  auth: gitlabAuth,
  name: 'update_project_webhook',
  displayName: 'Update Project Webhook',
  description: 'Changes the URL, events or settings of a project webhook. Fields left empty are not changed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes a GitLab project webhook: URL, name, description, branch filter, SSL verification and which events fire it. URL is required (GitLab needs it on every update; pass the current one to keep it). Only the other fields you set are sent; use Clear Fields to remove a description or branch filter. The secret token is not managed here. Changing a webhook created by an Activepieces trigger can stop that trigger. Requires Maintainer role.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    hookId: adminProps.hookId(),
    url: Property.ShortText({ displayName: 'URL', description: 'Address GitLab will POST events to. Enter the current URL to keep it.', required: true }),
    ...hookCommonProps(),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Settings to remove from the webhook.',
      required: false,
      options: {
        options: [
          { label: 'Description', value: 'description' },
          { label: 'Push Branch Filter', value: 'push_events_branch_filter' },
        ],
      },
    }),
    ...hookEventProps('Leave empty to keep the current value.'),
  },
  outputSchema: hookOutputSchema,
  async run({ auth, propsValue }) {
    const hookId = requirePositiveInt({ value: propsValue.hookId, label: 'Webhook ID' });
    const path = `${projectPath(propsValue.projectId)}/hooks/${hookId}`;
    const url = requireHookUrl(propsValue.url);
    const changes = hookBody(propsValue);
    for (const field of propsValue.clearFields ?? []) {
      if (!CLEARABLE_FIELDS.includes(field)) {
        throw new Error(`Unknown field to clear: ${field}.`);
      }
      if (field in changes) {
        throw new Error('A field cannot be both set and cleared.');
      }
      changes[field] = '';
    }
    return withoutToken(await gitlabRequest({ auth, method: 'PUT', path, body: { url, ...changes } }));
  },
});
