import { Property, createAction } from '@activepieces/pieces-framework';
import { deletedResult, makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';
import { clockodoAiProps } from './ai-props';

const userProps = {
  number: Property.ShortText({ displayName: 'Number', description: 'Personnel number.', required: false }),
  team_id: clockodoAiProps.id({ displayName: 'Team ID', source: 'Get Teams', required: false }),
  language: clockodoAiProps.language(),
  wage_type: clockodoAiProps.wageType(),
  can_generally_see_absences: clockodoAiProps.yesNo({
    displayName: 'Can See Absences',
    description: 'Whether the user can see absences of all users. Clockodo may grant this through the user\'s access group (e.g. Worker); then it can\'t be turned off per user — change the access group in Clockodo instead.',
  }),
  can_generally_manage_absences: clockodoAiProps.yesNo({
    displayName: 'Can Manage Absences',
    description: 'Whether the user can manage absences of all users.',
  }),
  can_add_customers: clockodoAiProps.yesNo({
    displayName: 'Can Add Customers',
    description: 'Whether the user can add customers.',
  }),
};

export const aiCreateUser = createAction({
  auth: clockodoAuth,
  name: 'ai_create_user',
  classification: 'WRITE',
  displayName: 'Create User',
  description: 'Creates a user in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.user,
  aiMetadata: {
    description:
      'Creates a Clockodo user (co-worker) with name, e-mail and role ("worker" or "owner"; Clockodo has no team leader role), optionally a team id, language and permissions, and returns it with its id. Clockodo may e-mail the new user and the seat may be billed. Not idempotent: check Get Users first.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    email: Property.ShortText({ displayName: 'E-Mail', required: true }),
    role: Property.StaticDropdown<string, true>({
      displayName: 'Role',
      description: 'worker or owner (Clockodo\'s API roles; finer rights come from access groups set in Clockodo).',
      required: true,
      options: { options: [{ label: 'Worker', value: 'worker' }, { label: 'Owner', value: 'owner' }] },
    }),
    ...userProps,
  },
  async run({ auth, propsValue }) {
    return makeClient(auth.props).createUser(
      clockodoRequests.userCreateBody({
        name: clockodoRequests.requireValue({ value: propsValue.name.trim(), field: 'Name' }),
        email: clockodoRequests.requireValue({ value: propsValue.email.trim(), field: 'E-Mail' }),
        role: clockodoRequests.requireValue({ value: clockodoRequests.parseRole({ value: propsValue.role, required: true }), field: 'Role' }),
        number: clockodoRequests.optionalText(propsValue.number),
        teams_id: clockodoRequests.parseOptionalId({ value: propsValue.team_id, field: 'Team ID' }),
        language: clockodoAiProps.parseLanguage(propsValue.language),
        wage_type: clockodoAiProps.parseWageType(propsValue.wage_type),
        can_generally_see_absences: clockodoRequests.parseYesNo({ value: propsValue.can_generally_see_absences, field: 'Can See Absences' }),
        can_generally_manage_absences: clockodoRequests.parseYesNo({ value: propsValue.can_generally_manage_absences, field: 'Can Manage Absences' }),
        can_add_customers: clockodoRequests.parseYesNo({ value: propsValue.can_add_customers, field: 'Can Add Customers' }),
      })
    );
  },
});

export const aiGetUser = createAction({
  auth: clockodoAuth,
  name: 'ai_get_user',
  classification: 'READ',
  displayName: 'Get User',
  description: 'Retrieves a single user from Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.user,
  aiMetadata: {
    description: 'Returns one Clockodo user by numeric user id (find ids with Get Users or Get Current User). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    user_id: clockodoAiProps.id({ displayName: 'User ID', source: 'Get Users', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.user_id, field: 'User ID' });
    return makeClient(auth.props).getUser(id);
  },
});

export const aiUpdateUser = createAction({
  auth: clockodoAuth,
  name: 'ai_update_user',
  classification: 'WRITE',
  displayName: 'Update User',
  description: 'Updates a user in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.user,
  aiMetadata: {
    description:
      'Changes only the fields you give on a Clockodo user identified by numeric user id: name, e-mail, role (worker/owner), team id ("none" removes the user from their team), language, wage type, permissions or active ("yes"/"no"; "no" deactivates the user). Idempotent.',
    idempotent: true,
  },
  props: {
    user_id: clockodoAiProps.id({ displayName: 'User ID', source: 'Get Users', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    email: Property.ShortText({ displayName: 'E-Mail', required: false }),
    role: Property.StaticDropdown<string, false>({
      displayName: 'Role',
      description: 'worker or owner (Clockodo\'s API roles; finer rights come from access groups set in Clockodo).',
      required: false,
      options: { options: [{ label: 'Worker', value: 'worker' }, { label: 'Owner', value: 'owner' }] },
    }),
    active: clockodoAiProps.yesNo({ displayName: 'Active', description: 'Whether the user is active.' }),
    ...userProps,
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.user_id, field: 'User ID' });
    return makeClient(auth.props).updateUser({
      id,
      request: clockodoRequests.userUpdateBody({
        name: propsValue.name || undefined,
        email: propsValue.email || undefined,
        role: clockodoRequests.parseRole({ value: propsValue.role, required: false }),
        active: clockodoRequests.parseYesNo({ value: propsValue.active, field: 'Active' }),
        number: clockodoRequests.optionalText(propsValue.number),
        teams_id: clockodoRequests.parseTeamForUpdate({ value: propsValue.team_id, remove: false }),
        language: clockodoAiProps.parseLanguage(propsValue.language),
        wage_type: clockodoAiProps.parseWageType(propsValue.wage_type),
        can_generally_see_absences: clockodoRequests.parseYesNo({ value: propsValue.can_generally_see_absences, field: 'Can See Absences' }),
        can_generally_manage_absences: clockodoRequests.parseYesNo({ value: propsValue.can_generally_manage_absences, field: 'Can Manage Absences' }),
        can_add_customers: clockodoRequests.parseYesNo({ value: propsValue.can_add_customers, field: 'Can Add Customers' }),
      }),
    });
  },
});

export const aiDeleteUser = createAction({
  auth: clockodoAuth,
  name: 'ai_delete_user',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete User',
  description: 'Deletes a user in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Clockodo user by numeric user id. The user must be inactive first: call Update User with active "no" (which alone usually suffices to keep history). Not idempotent: a second call fails because the user is gone.',
    idempotent: false,
  },
  props: {
    user_id: clockodoAiProps.id({ displayName: 'User ID', source: 'Get Users', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.user_id, field: 'User ID' });
    await makeClient(auth.props).deleteUser(id);
    return deletedResult(id);
  },
});
