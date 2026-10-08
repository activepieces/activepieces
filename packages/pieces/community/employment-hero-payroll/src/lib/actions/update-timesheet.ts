import { createAction } from '@activepieces/pieces-framework';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollProperties } from '../common/properties';
import { timesheetProperties } from '../common/timesheet-properties';
import { payrollTimesheets } from '../common/timesheets';

export const updateTimesheet = createAction({
  name: 'update_timesheet',
  classification: 'WRITE',
  displayName: 'Update Timesheet',
  description:
    'Updates the employee and time or quantity on an existing timesheet. Blank optional fields preserve existing values; breaks are replaced.',
  auth: employmentHeroPayrollAuth,
  audience: 'both',
  aiMetadata: {
    description:
      'Update a known timesheet ID. Reads the existing record to preserve omitted optional fields. The supplied time or quantity and breaks replace the current values. Avoid concurrent edits.',
    idempotent: true,
  },
  props: {
    ...timesheetProperties.props,
    timesheetId: payrollProperties.dropdown({
      displayName: 'Timesheet',
      resource: 'timesheet',
      required: true,
    }),
  },
  async run(context) {
    const { businessId, timesheetId, entry, ...values } = context.propsValue;
    return payrollTimesheets.update({
      apiKey: context.auth.secret_text,
      businessId,
      timesheetId,
      input: { ...entry, ...values },
    });
  },
});
