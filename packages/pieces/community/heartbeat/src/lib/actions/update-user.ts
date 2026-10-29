import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatUsers } from '../common/users';

const CLEARABLE_FIELDS = [
  { key: 'bio', label: 'Bio' },
  { key: 'status', label: 'Status' },
  { key: 'linkedin', label: 'LinkedIn URL' },
  { key: 'twitter', label: 'Twitter URL' },
  { key: 'instagram', label: 'Instagram URL' },
];

export const updateUserAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_update_user',
  classification: 'WRITE',
  displayName: 'Update Member',
  description: "Updates a member's profile, identified by email. Fields left empty stay as they are.",
  audience: 'both',
  aiMetadata: {
    description: "Changes a member's profile (name, bio, status, social links) identified by email; fields you omit stay as they are, and Fields to Clear blanks the chosen ones. Use after Find Member by Email. Setting the same values again changes nothing, so it is idempotent.",
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Email of the member to update.', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    bio: Property.LongText({ displayName: 'Bio', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    linkedin: Property.ShortText({ displayName: 'LinkedIn URL', description: 'Full URL including https://', required: false }),
    twitter: Property.ShortText({ displayName: 'Twitter URL', description: 'Full URL including https://', required: false }),
    instagram: Property.ShortText({ displayName: 'Instagram URL', description: 'Full URL including https://', required: false }),
    fieldsToClear: Property.StaticMultiSelectDropdown({
      displayName: 'Fields to Clear',
      description: 'Blank these fields. A field cannot be both set and cleared.',
      required: false,
      options: {
        disabled: false,
        options: CLEARABLE_FIELDS.map((field) => ({ label: field.label, value: field.key })),
      },
    }),
  },
  outputSchema: heartbeatOutputSchemas.updatedUser,
  async run({ auth, propsValue }) {
    const email = heartbeatApi.email({ value: propsValue.email, label: 'Email' });
    const values: Record<string, string | undefined> = {
      name: heartbeatApi.optionalText(propsValue.name),
      bio: heartbeatApi.optionalText(propsValue.bio),
      status: heartbeatApi.optionalText(propsValue.status),
      linkedin: heartbeatApi.optionalUrl({ value: propsValue.linkedin, label: 'LinkedIn URL' }),
      twitter: heartbeatApi.optionalUrl({ value: propsValue.twitter, label: 'Twitter URL' }),
      instagram: heartbeatApi.optionalUrl({ value: propsValue.instagram, label: 'Instagram URL' }),
    };
    const clear = (propsValue.fieldsToClear ?? []).map(String);
    const unknown = clear.filter((key) => !CLEARABLE_FIELDS.some((field) => field.key === key));
    if (unknown.length > 0) {
      throw new Error(`Fields to Clear: unknown field(s) ${unknown.join(', ')}. Allowed: ${CLEARABLE_FIELDS.map((field) => field.key).join(', ')}.`);
    }
    const conflicting = clear.filter((key) => values[key] !== undefined);
    if (conflicting.length > 0) {
      throw new Error(`These fields are both set and cleared: ${conflicting.join(', ')}. Choose one.`);
    }
    const changes = {
      ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)),
      ...Object.fromEntries(clear.map((key) => [key, ''])),
    };
    if (Object.keys(changes).length === 0) {
      throw new Error('Nothing to update: set at least one field or choose a field to clear.');
    }
    await heartbeatApi.request({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/users',
      operation: 'update member',
      body: { email, ...changes },
    });
    const lookup = await heartbeatApi.afterWrite({ what: 'the updated member', load: () => heartbeatUsers.findUserByEmail({ token: auth.secret_text, email }) });
    return { email, updated: true, updatedFields: Object.keys(changes), user: lookup.value, lookupError: lookup.lookupError };
  },
});

