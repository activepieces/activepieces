import { Property, InputPropertyMap } from '@activepieces/pieces-framework';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollProperties } from './properties';

const mode = Property.StaticDropdown({
  displayName: 'Entry Type',
  required: true,
  defaultValue: 'hours',
  display: 'cards',
  options: {
    options: [
      { label: 'Start and end times', value: 'hours' },
      { label: 'Quantity', value: 'units' },
    ],
  },
});
const startTime = Property.ShortText({
  displayName: 'Start Time',
  description:
    'Local time in the payroll business time zone, for example 2026-10-08T09:00:00. Do not include Z or a UTC offset.',
  required: true,
});
const endTime = Property.ShortText({
  displayName: 'End Time',
  description:
    'Local time in the payroll business time zone, for example 2026-10-08T17:00:00. Overnight shifts may end on the following date.',
  required: true,
});
const date = Property.ShortText({
  displayName: 'Date',
  description:
    'Payroll business local date in YYYY-MM-DD format. Quantity entries are stored at midnight.',
  required: true,
});
const units = Property.Number({
  displayName: 'Quantity',
  description:
    'Positive number of units. The selected pay category or work type determines what a unit means.',
  required: true,
});
const breaks = Property.Array({
  displayName: 'Breaks',
  required: false,
  properties: {
    startTime,
    endTime,
    isPaidBreak: Property.Checkbox({
      displayName: 'Paid Break',
      required: false,
      defaultValue: false,
    }),
  },
});
const optional = {
  locationId: payrollProperties.dropdown({
    displayName: 'Location',
    resource: 'location',
    required: false,
  }),
  payCategoryId: payrollProperties.dropdown({
    displayName: 'Pay Category',
    resource: 'paycategory',
    required: false,
  }),
  workTypeId: payrollProperties.dropdown({
    displayName: 'Work Type',
    resource: 'worktype',
    required: false,
  }),
  comments: Property.LongText({ displayName: 'Comments', required: false }),
  externalId: Property.ShortText({
    displayName: 'External ID',
    description:
      'Stable identifier from the source system. Use the same value when retrying the same timesheet.',
    required: false,
  }),
  rate: Property.Number({
    displayName: 'Rate Override',
    description:
      'Optional non-negative rate. Leave blank to use the payroll configuration.',
    required: false,
    advanced: true,
  }),
};
const props = {
  businessId: payrollProperties.business,
  employeeId: payrollProperties.employee,
  mode,
  entry: Property.DynamicProperties({
    auth: employmentHeroPayrollAuth,
    displayName: 'Time or Quantity',
    required: true,
    refreshers: ['mode'],
    props: async ({ mode }): Promise<InputPropertyMap> =>
      mode === 'units' ? { date, units } : { startTime, endTime, breaks },
  }),
  ...optional,
};

export const timesheetProperties = {
  props,
  batchFields: {
    mode,
    startTime: { ...startTime, required: false },
    endTime: { ...endTime, required: false },
    date: { ...date, required: false },
    units: { ...units, required: false },
    comments: optional.comments,
    externalId: optional.externalId,
    rate: optional.rate,
  },
};
