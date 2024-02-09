import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'create_user',
  displayName: 'Create User',
  description: 'Creates a user in clockodo',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'E-Mail',
      required: true,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      required: true,
    }),
    number: Property.ShortText({
      displayName: 'Number',
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
    const res = await client.createUser({
      name: propsValue.name,
      email: propsValue.email,
      role: propsValue.role,
      number: emptyToNull(propsValue.number),
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
