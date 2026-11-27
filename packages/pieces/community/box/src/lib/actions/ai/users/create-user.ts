import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const BOOLEANS = ['true', 'false'];
const ROLES = ['coadmin', 'user'];
const STATUSES = ['active', 'inactive', 'cannot_delete_edit', 'cannot_delete_edit_upload'];

export const createUserAction = createAction({
  auth: boxAuth,
  name: 'box_create_user',
  displayName: 'Create User',
  description: 'Creates a managed user or app user in the Box enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an enterprise user and returns its ID; needs admin rights. Login is required unless App User Only is "true". Use Invite User instead to bring an existing Box account into the enterprise.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'The user\'s full name.', required: true }),
    login: Property.ShortText({
      displayName: 'Login',
      description: 'The email address the user logs in with. Required unless App User Only is "true".',
      required: false,
    }),
    isPlatformAccessOnly: boxAiProps.booleanFlag({
      required: false,
      displayName: 'App User Only',
      description: '"true" to create an app user with no login, for use only through the API.',
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: '"user" (default) or "coadmin".',
      required: false,
      options: { options: ROLES.map((value) => ({ label: value, value })) },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'active, inactive, cannot_delete_edit or cannot_delete_edit_upload.',
      required: false,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
    jobTitle: Property.ShortText({ displayName: 'Job Title', description: 'The user\'s job title.', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', description: 'The user\'s phone number.', required: false }),
    address: Property.ShortText({ displayName: 'Address', description: 'The user\'s address.', required: false }),
    language: Property.ShortText({ displayName: 'Language', description: 'Language code, e.g. "en".', required: false }),
    timezone: Property.ShortText({ displayName: 'Timezone', description: 'IANA timezone, e.g. "Europe/London".', required: false }),
    spaceAmount: Property.Number({
      displayName: 'Space Amount',
      description: 'Storage quota in bytes; -1 for unlimited.',
      required: false,
    }),
    externalAppUserId: Property.ShortText({
      displayName: 'External App User ID',
      description: 'Your own identifier for the user, to look them up later with List Users.',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Other Box user fields, e.g. {"is_sync_enabled": true, "can_see_managed_users": true, "is_external_collab_restricted": true}.',
      required: false,
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.isPlatformAccessOnly !== undefined && !BOOLEANS.includes(propsValue.isPlatformAccessOnly)) {
      throw new Error('App User Only must be "true" or "false".');
    }
    if (propsValue.role !== undefined && !ROLES.includes(propsValue.role)) {
      throw new Error(`Role must be one of: ${ROLES.join(', ')}.`);
    }
    if (propsValue.status !== undefined && !STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/users',
      query: { fields: propsValue.fields },
      body: {
        ...(propsValue.additionalFields ?? {}),
        name: propsValue.name,
        ...(propsValue.login !== undefined ? { login: propsValue.login } : {}),
        ...(propsValue.isPlatformAccessOnly !== undefined ? { is_platform_access_only: propsValue.isPlatformAccessOnly === 'true' } : {}),
        ...(propsValue.role !== undefined ? { role: propsValue.role } : {}),
        ...(propsValue.status !== undefined ? { status: propsValue.status } : {}),
        ...(propsValue.jobTitle !== undefined ? { job_title: propsValue.jobTitle } : {}),
        ...(propsValue.phone !== undefined ? { phone: propsValue.phone } : {}),
        ...(propsValue.address !== undefined ? { address: propsValue.address } : {}),
        ...(propsValue.language !== undefined ? { language: propsValue.language } : {}),
        ...(propsValue.timezone !== undefined ? { timezone: propsValue.timezone } : {}),
        ...(propsValue.spaceAmount !== undefined ? { space_amount: propsValue.spaceAmount } : {}),
        ...(propsValue.externalAppUserId !== undefined ? { external_app_user_id: propsValue.externalAppUserId } : {}),
      },
    });
  },
});
