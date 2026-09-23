import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaUpdateUserAction = createAction({
  auth: asanaAuth,
  name: 'update_user',
  classification: 'WRITE',
  displayName: 'Update User',
  description: 'Set a user\'s profile custom fields (or your own name) in an Asana workspace (higher Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a user\'s profile in one workspace: values of user-profile custom fields (keyed by custom field gid) and, only when the user is the connected user, their name. Only the fields you set change. Custom field values are text, a number, an enum option gid, or a date as YYYY-MM-DD; find field gids with List Custom Fields. User profile custom fields are a higher-tier Asana feature (likely Enterprise); lower plans get a paid-plan or permission error. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace whose user profile to update. Obtain it from List Workspaces.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User',
      description: 'User to update: "me", an email address or a user gid.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New display name. Asana only accepts this for the connected user ("me"). Leave empty to keep it.',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Field Values',
      description: 'Map of custom field gid to new value, for example 1201234567890 = "Berlin office". Leave empty to keep them.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace, user, name, custom_fields } = context.propsValue;
    const customFields = toCustomFieldValues(custom_fields);
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(name) ? { name } : {}),
      ...(Object.keys(customFields).length > 0 ? { custom_fields: customFields } : {}),
    };
    asanaUtils.assertNotEmpty({ patch: data, fields: 'Name or Custom Field Values' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/workspaces/${asanaUtils.pathSegment(workspace)}/users/${asanaUtils.pathSegment(user)}`,
      operation: 'Update User',
      query: { opt_fields: ASANA_FIELDS.userInWorkspace },
      data,
    });
  },
});

function toCustomFieldValues(value: Record<string, unknown> | undefined | null): Record<string, string | number> {
  if (value === undefined || value === null) {
    return {};
  }
  return Object.entries(value).reduce<Record<string, string | number>>((acc, [key, raw]) => {
    const gid = key.trim();
    if (gid === '' || raw === undefined || raw === null || raw === '') {
      return acc;
    }
    if (typeof raw !== 'string' && typeof raw !== 'number') {
      throw new Error(`Custom Field Values: the value for ${gid} must be text, a number, an enum option gid or a YYYY-MM-DD date.`);
    }
    return { ...acc, [gid]: raw };
  }, {});
}
