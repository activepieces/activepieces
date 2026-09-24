import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { updateRepoSettingsOutputSchema } from '../output-schemas';

export const updateRepoSettings = createAction({
  auth: huggingFaceAuth,
  name: 'update_repo_settings',
  classification: 'WRITE',
  displayName: 'Update Repo Settings',
  description: 'Change the visibility, discussions or gated-access settings of a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Changes only the settings you provide on a model, dataset or Space repository (visibility, discussions on/off, gated access mode, gated-request notifications); every setting left empty is kept as it is. Warning: switching Visibility to Public exposes the repository and its files to everyone, and setting Gated Access to 'Not gated' removes the access gate, so only do either when the user explicitly asks. Safe to retry. Requires a write-role token with admin rights on the repository.",
    idempotent: true,
  },
  outputSchema: updateRepoSettingsOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description:
        'Leave empty to keep the current visibility. Public makes the repository and all its files visible to everyone.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
    discussions: Property.StaticDropdown({
      displayName: 'Discussions',
      description: 'Leave empty to keep the current setting. Disabled hides the Community tab and blocks new discussions.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
    }),
    gated: Property.StaticDropdown({
      displayName: 'Gated Access',
      description:
        "Leave empty to keep the current gate. 'Automatic approval' and 'Manual approval' require users to request access; 'Not gated' removes the gate. Not available for Spaces.",
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Not gated', value: 'false' },
          { label: 'Automatic approval', value: 'auto' },
          { label: 'Manual approval', value: 'manual' },
        ],
      },
    }),
    gated_notifications_mode: Property.StaticDropdown({
      displayName: 'Access Request Notifications',
      description: 'Leave empty to keep the current mode. How the owner is notified of new gated-access requests.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Real-time (one email per request)', value: 'real-time' },
          { label: 'Bulk (daily digest)', value: 'bulk' },
        ],
      },
    }),
    gated_notifications_email: Property.ShortText({
      displayName: 'Notification Email',
      description: 'Leave empty to keep the current address. The email address that receives gated-access request notifications.',
      required: false,
    }),
  },
  async run(context) {
    const {
      repo_type,
      repo_id,
      visibility,
      discussions,
      gated,
      gated_notifications_mode,
      gated_notifications_email,
    } = context.propsValue;
    const token = context.auth.secret_text;
    const settings: Record<string, unknown> = {};
    if (visibility !== undefined && visibility !== null) {
      settings['private'] = visibility === 'private';
    }
    if (discussions !== undefined && discussions !== null) {
      settings['discussionsDisabled'] = discussions === 'disabled';
    }
    if (gated !== undefined && gated !== null) {
      settings['gated'] = gated === 'false' ? false : gated;
    }
    if (gated_notifications_mode !== undefined && gated_notifications_mode !== null) {
      settings['gatedNotificationsMode'] = gated_notifications_mode;
    }
    const email = hfWrite.optionalText({ value: gated_notifications_email, name: 'Notification Email' });
    if (email !== undefined) {
      settings['gatedNotificationsEmail'] = email;
    }
    if (Object.keys(settings).length === 0) {
      throw new Error('Provide at least one setting to change. Settings left empty are never modified.');
    }
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfWrite.request({
      token,
      method: HttpMethod.PUT,
      path: `${repo.apiPath}/settings`,
      body: settings,
    });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      updated_settings: Object.keys(settings),
      settings: response ?? settings,
    };
  },
});
