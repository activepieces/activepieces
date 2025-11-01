import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import { caseDropdown, staffDropdown } from '../common/props';

export const createTimeEntry = createAction({
  auth: myCaseAuth,
  name: 'createTimeEntry',
  displayName: 'Create Time Entry',
  description: 'Create a new time entry',
  props: {
    activity_name: Property.ShortText({
      displayName: 'Activity Name',
      description: 'The activity name for this time entry',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Time entry description',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Mark this time entry as billable',
      required: false,
      defaultValue: true,
    }),
    entry_date: Property.DateTime({
      displayName: 'Entry Date',
      description: 'Date of the time entry',
      required: true,
    }),
    rate: Property.Number({
      displayName: 'Rate ($)',
      description: 'Rate in dollars',
      required: true,
    }),
    hours: Property.Number({
      displayName: 'Hours',
      description: 'The duration in hours associated with this time entry',
      required: true,
    }),
    flat_fee: Property.Checkbox({
      displayName: 'Flat Fee',
      description: 'Whether or not this time entry is a flat fee',
      required: false,
      defaultValue: false,
    }),
    case_id: caseDropdown({
      description: 'Select the case for this time entry',
      required: true,
    }),
    staff_id: staffDropdown({
      description: 'Select the staff member',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload: any = {
      activity_name: propsValue.activity_name,
      description: propsValue.description,
      billable: propsValue.billable,
      entry_date: propsValue.entry_date,
      rate: propsValue.rate,
      hours: propsValue.hours,
      flat_fee: propsValue.flat_fee,
      case: { id: propsValue.case_id },
      staff: { id: propsValue.staff_id },
    };

    return await myCaseApiService.createTimeEntry({
      accessToken: auth.access_token,
      payload,
    });
  },
});
