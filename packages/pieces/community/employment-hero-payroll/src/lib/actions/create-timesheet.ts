import { createAction, Property } from '@activepieces/pieces-framework';
import { employmentHeroPayrollAuth } from '../auth';
import { timesheetProperties } from '../common/timesheet-properties';
import { payrollTimesheets } from '../common/timesheets';

export const createTimesheet = createAction({
  name: 'create_timesheet',
  classification: 'WRITE',
  displayName: 'Create Timesheet',
  description: 'Creates one time or quantity entry for an employee.',
  auth: employmentHeroPayrollAuth,
  audience: 'both',
  aiMetadata: {
    description:
      'Create one timesheet or allowance quantity. Supply a stable External ID with duplicate prevention. A duplicate may be rejected rather than returned. Do not blindly retry an uncertain write.',
    idempotent: false,
  },
  errorHandlingOptions: {
    retryOnFailure: { defaultValue: false, hide: true },
    continueOnFailure: { defaultValue: false },
  },
  props: {
    ...timesheetProperties.props,
    preventDuplicates: Property.Checkbox({
      displayName: 'Prevent Duplicate External IDs',
      description:
        'Requires External ID. Asks Payroll to reject duplicate source records. Disable only if you intentionally want repeated entries.',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { businessId, entry, preventDuplicates, ...values } =
      context.propsValue;
    return payrollTimesheets.create({
      apiKey: context.auth.secret_text,
      businessId,
      preventDuplicates,
      input: { ...entry, ...values },
    });
  },
});
