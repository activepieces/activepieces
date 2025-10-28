import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import { caseDropdown, staffDropdown } from '../common/props';

export const createExpense = createAction({
  auth: myCaseAuth,
  name: 'createExpense',
  displayName: 'Create Expense',
  description: 'Creates a new expense',
  props: {
    activity_name: Property.ShortText({
      displayName: 'Activity Name',
      description:
        'The activity name for this expense. If no matching activity exists, one will be created',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Expense description',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether this expense is billable',
      required: true,
      defaultValue: true,
    }),
    entry_date: Property.DateTime({
      displayName: 'Entry Date',
      description: 'The entry date of this expense',
      required: true,
    }),
    cost: Property.Number({
      displayName: 'Cost',
      description: 'The cost of this expense',
      required: true,
    }),
    units: Property.Number({
      displayName: 'Units',
      description: 'The number of units',
      required: true,
      defaultValue: 1,
    }),
    case_id: caseDropdown({
      description: 'Select the case for this expense',
      required: true,
    }),
    staff_id: staffDropdown({
      description: 'Select the staff member for this expense',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload: any = {
      activity_name: propsValue.activity_name,
      description: propsValue.description,
      billable: propsValue.billable,
      entry_date: propsValue.entry_date,
      cost: propsValue.cost,
      units: propsValue.units,
      case: { id: propsValue.case_id },
    };

    if (propsValue.staff_id) {
      payload.staff = { id: propsValue.staff_id };
    }

    return await myCaseApiService.createExpense({
      accessToken: auth.access_token,
      payload,
    });
  },
});
