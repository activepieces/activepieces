import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateUserOutputSchema } from '../../../output-schemas';

const ROLES = ['coadmin', 'user'];
const STATUSES = ['active', 'inactive', 'cannot_delete_edit', 'cannot_delete_edit_upload'];
const CLEARABLE = ['job_title', 'phone', 'address', 'notification_email'];

export const updateUserAction = createAction({
  auth: boxAuth,
  name: 'box_update_user',
  outputSchema: boxCreateUserOutputSchema,
  displayName: 'Update User',
  description: 'Changes the details of a Box enterprise user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes an enterprise user\'s name, login, role, status, profile or quota; only the fields given change. Needs admin rights. Get the ID from List Users.',
    idempotent: true,
  },
  props: {
    userId: boxAiProps.userId({ required: true, description: 'Box user ID to update. Get it from List Users.' }),
    name: Property.ShortText({ displayName: 'Name', description: 'New full name.', required: false }),
    login: Property.ShortText({
      displayName: 'Login',
      description: 'New primary login email. It must already be a confirmed email alias of the user (see Create Email Alias).',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: '"user" or "coadmin".',
      required: false,
      options: { options: ROLES.map((value) => ({ label: value, value })) },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'active, inactive, cannot_delete_edit or cannot_delete_edit_upload.',
      required: false,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
    jobTitle: Property.ShortText({ displayName: 'Job Title', description: 'New job title.', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', description: 'New phone number.', required: false }),
    address: Property.ShortText({ displayName: 'Address', description: 'New address.', required: false }),
    language: Property.ShortText({ displayName: 'Language', description: 'Language code, e.g. "en".', required: false }),
    timezone: Property.ShortText({ displayName: 'Timezone', description: 'IANA timezone, e.g. "Europe/London".', required: false }),
    spaceAmount: Property.Number({
      displayName: 'Space Amount',
      description: 'Storage quota in bytes; -1 for unlimited.',
      required: false,
    }),
    notificationEmail: Property.ShortText({
      displayName: 'Notification Email',
      description: 'Alternate address Box sends notifications to once it is confirmed.',
      required: false,
    }),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty: job_title, phone, address and/or notification_email. Do not also give a value for a field you clear.',
      required: false,
      options: { options: CLEARABLE.map((value) => ({ label: value, value })) },
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Other Box user fields, e.g. {"is_sync_enabled": false, "is_password_reset_required": true, "can_see_managed_users": true}.',
      required: false,
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.role !== undefined && !ROLES.includes(propsValue.role)) {
      throw new Error(`Role must be one of: ${ROLES.join(', ')}.`);
    }
    if (propsValue.status !== undefined && !STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    const clear = propsValue.clearFields ?? [];
    const unknownClear = clear.filter((field) => !CLEARABLE.includes(field));
    if (unknownClear.length > 0) {
      throw new Error(`Clear Fields must be from: ${CLEARABLE.join(', ')}.`);
    }
    const values: Record<string, unknown> = {
      job_title: propsValue.jobTitle,
      phone: propsValue.phone,
      address: propsValue.address,
      notification_email: propsValue.notificationEmail === undefined ? undefined : { email: propsValue.notificationEmail },
    };
    const conflict = clear.find((field) => values[field] !== undefined);
    if (conflict !== undefined) {
      throw new Error(`Give either a value for ${conflict} or "${conflict}" in Clear Fields, not both.`);
    }
    const body = {
      ...(propsValue.additionalFields ?? {}),
      ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
      ...(propsValue.login !== undefined ? { login: propsValue.login } : {}),
      ...(propsValue.role !== undefined ? { role: propsValue.role } : {}),
      ...(propsValue.status !== undefined ? { status: propsValue.status } : {}),
      ...(propsValue.language !== undefined ? { language: propsValue.language } : {}),
      ...(propsValue.timezone !== undefined ? { timezone: propsValue.timezone } : {}),
      ...(propsValue.spaceAmount !== undefined ? { space_amount: propsValue.spaceAmount } : {}),
      ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)),
      ...Object.fromEntries(clear.map((field) => [field, field === 'notification_email' ? null : ''])),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(propsValue.userId)}`,
      query: { fields: propsValue.fields },
      body,
    });
  },
});
