import {
  createAction,
  Property,
  InputPropertyMap,
} from '@activepieces/pieces-framework';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollProperties } from '../common/properties';
import { timesheetProperties } from '../common/timesheet-properties';
import { payrollTimesheets } from '../common/timesheets';

export const bulkCreateTimesheets = createAction({
  name: 'bulk_create_timesheets',
  classification: 'WRITE',
  displayName: 'Bulk Create Timesheets',
  description:
    'Appends up to 100 entries. Existing timesheets are never replaced. Repeating a batch can create duplicates.',
  auth: employmentHeroPayrollAuth,
  audience: 'both',
  aiMetadata: {
    description:
      'Append up to 100 timesheet lines grouped by employee. Quantity entries require Date and Quantity; hours entries require Start and End Time. No server duplicate guard is documented for this endpoint. Reconcile before retrying.',
    idempotent: false,
  },
  errorHandlingOptions: {
    retryOnFailure: { defaultValue: false, hide: true },
    continueOnFailure: { defaultValue: false },
  },
  props: {
    businessId: payrollProperties.business,
    batch: Property.DynamicProperties({
      auth: employmentHeroPayrollAuth,
      displayName: 'Timesheets',
      required: true,
      refreshers: ['businessId'],
      props: async (props, context): Promise<InputPropertyMap> => {
        if (!props.auth || !props['businessId']) return {};
        const [employees, locations, payCategories, workTypes] =
          await Promise.all([
            payrollProperties.employee.options(props, context),
            payrollProperties
              .dropdown({
                displayName: 'Location',
                resource: 'location',
                required: false,
              })
              .options(props, context),
            payrollProperties
              .dropdown({
                displayName: 'Pay Category',
                resource: 'paycategory',
                required: false,
              })
              .options(props, context),
            payrollProperties
              .dropdown({
                displayName: 'Work Type',
                resource: 'worktype',
                required: false,
              })
              .options(props, context),
          ]);
        return {
          entries: Property.Array({
            displayName: 'Timesheets',
            description:
              'Up to 100 entries. Use local Start and End Time for hours, or Date and Quantity for units. For multiple breaks, use Create Timesheet or map an array containing breaks with startTime, endTime and isPaidBreak.',
            required: true,
            properties: {
              employeeId: Property.StaticDropdown({
                displayName: 'Employee',
                required: true,
                options: employees,
              }),
              ...timesheetProperties.batchFields,
              locationId: Property.StaticDropdown({
                displayName: 'Location',
                required: false,
                options: locations,
              }),
              payCategoryId: Property.StaticDropdown({
                displayName: 'Pay Category',
                required: false,
                options: payCategories,
              }),
              workTypeId: Property.StaticDropdown({
                displayName: 'Work Type',
                required: false,
                options: workTypes,
              }),
            },
          }),
        };
      },
    }),
    approved: Property.Checkbox({
      displayName: 'Mark as Approved',
      description:
        'Leave off to use the normal approval process. Requires sufficient Payroll permissions when enabled.',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    return payrollTimesheets.bulkCreate({
      apiKey: context.auth.secret_text,
      businessId: context.propsValue.businessId,
      inputs: context.propsValue.batch['entries'],
      approved: context.propsValue.approved,
    });
  },
});
