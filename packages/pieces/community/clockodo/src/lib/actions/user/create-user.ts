import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'create_user',
  classification: 'WRITE',
  displayName: 'Create User',
  description: 'Creates a user in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.user,
  aiMetadata: { description: 'Create a new Clockodo user with required name, email, and role, plus optional team, language, wage type, and permissions. Not idempotent: each call adds another user even with the same email, so guard against duplicates. To change an existing user use Update User.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name as shown in Clockodo.',
      placeholder: 'e.g. Jane Doe',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'E-Mail',
      description: 'E-mail address of the user.',
      placeholder: 'e.g. jane@example.com',
      required: true,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      description: 'worker or owner (Clockodo\'s API roles; finer rights come from access groups set in Clockodo).',
      placeholder: 'worker',
      required: true,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      description: 'Optional reference number of your own.',
      placeholder: 'e.g. E-042',
      required: false,
    }),
    team_id: clockodoCommon.team_id(false),
    language: clockodoCommon.language(false),
    wage_type: Property.StaticDropdown({
      displayName: 'Wage Type',
      description: 'How the user is paid.',
      required: false,
      options: {
        options: [
          { label: 'Salary', value: 1 },
          { label: 'Hourly wage', value: 2 },
        ],
      },
    }),
    can_generally_see_absences: Property.Checkbox({
      displayName: 'Can see absences',
      description: 'Whether the user can see absences of all users. Clockodo may grant this through the user\'s access group (e.g. Worker); then it can\'t be turned off per user — change the access group in Clockodo instead.',
      required: false,
    }),
    can_generally_manage_absences: Property.Checkbox({
      displayName: 'Can manage absences',
      description: 'Whether the user can manage absences of all users.',
      required: false,
    }),
    can_add_customers: Property.Checkbox({
      displayName: 'Can add customers',
      description: 'Whether the user can add customers.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return makeClient(auth.props).createUser(
      clockodoRequests.userCreateBody({
        name: propsValue.name,
        email: propsValue.email,
        role: clockodoRequests.requireValue({ value: clockodoRequests.parseRole({ value: propsValue.role, required: true }), field: 'Role' }),
        number: emptyToNull(propsValue.number),
        teams_id: clockodoRequests.parseOptionalId({ value: propsValue.team_id, field: 'Team' }),
        language: propsValue.language || undefined,
        wage_type: propsValue.wage_type ?? undefined,
        can_generally_see_absences: propsValue.can_generally_see_absences,
        can_generally_manage_absences: propsValue.can_generally_manage_absences,
        can_add_customers: propsValue.can_add_customers,
      })
    );
  },
});
