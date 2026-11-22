import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'update_user',
  classification: 'WRITE',
  displayName: 'Update User',
  description: 'Updates a user in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.user,
  aiMetadata: { description: 'Update an existing Clockodo user identified by their numeric user ID, changing only the fields you supply (name, email, role, team, language, wage type, absence/customer permissions, active flag). Idempotent: re-sending the same values leaves the user unchanged. Requires a user ID; use Create User to add a new one.', idempotent: true },
  props: {
    user_id: clockodoCommon.user_id(true, null),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name as shown in Clockodo.',
      placeholder: 'e.g. Jane Doe',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'E-Mail',
      description: 'E-mail address of the user.',
      placeholder: 'e.g. jane@example.com',
      required: false,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      description: 'worker or owner (Clockodo\'s API roles; finer rights come from access groups set in Clockodo).',
      placeholder: 'worker',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      description: 'Optional reference number of your own.',
      placeholder: 'e.g. E-042',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Tick to set to yes. Leaving it unticked changes nothing — use Active Status to set no.',
      required: false,
    }),
    active_status: clockodoCommon.keepYesNo({
      displayName: 'Active Status',
      description: 'Set to Yes or No. Keep or empty leaves it unchanged; overrides the checkbox above.',
    }),
    team_id: clockodoCommon.team_id(false),
    team_status: Property.StaticDropdown<string, false>({
      displayName: 'Team Status',
      description: 'Choose Remove from team to take the user out of their team. Keep or empty uses the Team field above.',
      required: false,
      options: {
        options: [
          { label: 'Keep', value: 'keep' },
          { label: 'Remove from team', value: 'remove' },
        ],
      },
    }),
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
      displayName: 'Can See Absences',
      description: 'Tick to set to yes. Leaving it unticked changes nothing — use Can See Absences Status to set no. Clockodo may grant this through the user\'s access group (e.g. Worker); then it can\'t be turned off per user — change the access group in Clockodo instead.',
      required: false,
    }),
    can_generally_see_absences_status: clockodoCommon.keepYesNo({
      displayName: 'Can See Absences Status',
      description: 'Set to Yes or No. Keep or empty leaves it unchanged; overrides the checkbox above. Clockodo may grant this through the user\'s access group (e.g. Worker); then it can\'t be turned off per user — change the access group in Clockodo instead.',
    }),
    can_generally_manage_absences: Property.Checkbox({
      displayName: 'Can Manage Absences',
      description: 'Tick to set to yes. Leaving it unticked changes nothing — use Can Manage Absences Status to set no.',
      required: false,
    }),
    can_generally_manage_absences_status: clockodoCommon.keepYesNo({
      displayName: 'Can Manage Absences Status',
      description: 'Set to Yes or No. Keep or empty leaves it unchanged; overrides the checkbox above.',
    }),
    can_add_customers: Property.Checkbox({
      displayName: 'Can Add Customers',
      description: 'Tick to set to yes. Leaving it unticked changes nothing — use Can Add Customers Status to set no.',
      required: false,
    }),
    can_add_customers_status: clockodoCommon.keepYesNo({
      displayName: 'Can Add Customers Status',
      description: 'Set to Yes or No. Keep or empty leaves it unchanged; overrides the checkbox above.',
    }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.user_id, field: 'User' });
    return makeClient(auth.props).updateUser({
      id,
      request: clockodoRequests.userUpdateBody({
        name: propsValue.name || undefined,
        email: propsValue.email || undefined,
        role: clockodoRequests.parseRole({ value: propsValue.role, required: false }),
        number: emptyToNull(propsValue.number),
        active: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.active, status: propsValue.active_status, field: 'Active Status' }),
        teams_id: clockodoRequests.parseTeamForUpdate({ value: propsValue.team_id, remove: propsValue.team_status === 'remove' }),
        language: propsValue.language || undefined,
        wage_type: propsValue.wage_type ?? undefined,
        can_generally_see_absences: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.can_generally_see_absences, status: propsValue.can_generally_see_absences_status, field: 'Can See Absences Status' }),
        can_generally_manage_absences: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.can_generally_manage_absences, status: propsValue.can_generally_manage_absences_status, field: 'Can Manage Absences Status' }),
        can_add_customers: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.can_add_customers, status: propsValue.can_add_customers_status, field: 'Can Add Customers Status' }),
      }),
    });
  },
});
