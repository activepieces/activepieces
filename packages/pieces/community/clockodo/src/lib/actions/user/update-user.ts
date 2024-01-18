import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'update_user',
  displayName: 'Update User',
  description: 'Updates a user in clockodo',
  props: {
    user_id: clockodoCommon.user_id(true, null),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'E-Mail',
      required: false,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      required: false,
    }),
    team_id: clockodoCommon.team_id(false),
    language: clockodoCommon.language(false),
    wage_type: Property.StaticDropdown({
      displayName: 'Wage Type',
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
      required: false,
    }),
    can_generally_manage_absences: Property.Checkbox({
      displayName: 'Can manage absences',
      required: false,
    }),
    can_add_customers: Property.Checkbox({
      displayName: 'Can add customers',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.updateUser(propsValue.user_id as number, {
      name: propsValue.name,
      email: propsValue.email,
      role: propsValue.role,
      number: emptyToNull(propsValue.number),
      active: propsValue.active,
      teams_id: propsValue.team_id,
      language: propsValue.language,
      wage_type: propsValue.wage_type,
      can_generally_see_absences: propsValue.can_generally_see_absences,
      can_generally_manage_absences: propsValue.can_generally_manage_absences,
      can_add_customers: propsValue.can_add_customers,
    });
    return res.user;
  },
});
