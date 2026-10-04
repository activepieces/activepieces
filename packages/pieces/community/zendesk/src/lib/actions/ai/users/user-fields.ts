import { Property } from '@activepieces/pieces-framework';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';

function props({ nameRequired }: { nameRequired: boolean }) {
  return {
    name: Property.ShortText({ displayName: 'Name', required: nameRequired }),
    email: Property.ShortText({ displayName: 'Email', description: 'Primary email address.', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Defaults to end-user. Only admins can create agents and admins.',
      required: false,
      options: {
        options: [
          { label: 'End user', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
    organization_id: zendeskAiProps.optionalId({
      displayName: 'Organization ID',
      description: 'Organization ID, from Search Organizations.',
    }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Your own reference for the user.', required: false }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Replaces every tag on the user. Prefer Add User Tags or Remove User Tags on existing users.',
      required: false,
    }),
    user_fields: Property.Json({
      displayName: 'User Fields',
      description: 'Object of custom user field keys to values, keys from List User Fields, e.g. {"plan": "pro"}.',
      required: false,
    }),
    details: Property.LongText({ displayName: 'Details', description: 'Details such as an address.', required: false }),
    notes: Property.LongText({ displayName: 'Notes', description: 'Internal notes visible to agents.', required: false }),
    verified: zendeskAiProps.optionalBoolean({
      displayName: 'Verified',
      description: 'Mark the email as verified so Zendesk sends no verification email.',
    }),
    additional_fields: zendeskAiProps.additionalFields({
      description: 'Other user attributes from the Zendesk Users API, e.g. {"time_zone": "Berlin", "locale": "de"}, or null values to clear fields.',
    }),
  };
}

function body(values: UserFieldValues): Record<string, unknown> {
  const tags = zendeskApi.stringList(values.tags);
  const userFields = zendeskApi.jsonObject({ value: values.user_fields, label: 'User Fields' });
  return {
    ...zendeskApi.jsonObject({ value: values.additional_fields, label: 'Additional Fields' }),
    ...zendeskApi.compact({
      name: values.name,
      email: values.email,
      phone: values.phone,
      role: values.role,
      organization_id: zendeskApi.optionalId({ value: values.organization_id, label: 'Organization ID' }),
      external_id: values.external_id,
      tags: tags.length > 0 ? tags : undefined,
      user_fields: Object.keys(userFields).length > 0 ? userFields : undefined,
      details: values.details,
      notes: values.notes,
      verified: zendeskApi.optionalBoolean(values.verified),
    }),
  };
}

export const zendeskUserFields = { props, body };

type UserFieldValues = {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  organization_id?: string;
  external_id?: string;
  tags?: unknown[];
  user_fields?: unknown;
  details?: string;
  notes?: string;
  verified?: string;
  additional_fields?: unknown;
};
