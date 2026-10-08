import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollClient } from '../common/client';
import { payrollOutput } from '../common/output';
import { payrollProperties } from '../common/properties';

export const listTimesheets = createAction({
  name: 'list_timesheets',
  classification: 'SEARCH',
  displayName: 'List Timesheets',
  description:
    'Lists a page of timesheets, optionally filtered by employee and local date.',
  auth: employmentHeroPayrollAuth,
  audience: 'both',
  aiMetadata: {
    description:
      'Find timesheets by employee and a business-local date window. Date Until is exclusive. Use Offset for subsequent pages. Safe to retry.',
    idempotent: true,
  },
  props: {
    businessId: payrollProperties.business,
    employeeId: payrollProperties.dropdown({
      displayName: 'Employee',
      resource: 'employee/details',
      required: false,
    }),
    fromDate: Property.ShortText({
      displayName: 'Date From',
      description:
        'Inclusive local date, YYYY-MM-DD. Filters by timesheet start time.',
      required: false,
    }),
    toDate: Property.ShortText({
      displayName: 'Date Until',
      description:
        'Exclusive local date, YYYY-MM-DD. To include all of 8 October, use 2026-10-09.',
      required: false,
    }),
    ...payrollProperties.pagination,
  },
  async run(context) {
    const { employeeId, fromDate, toDate, filter, businessId, limit, offset } =
      context.propsValue;
    const filters: string[] = [];
    if (employeeId)
      filters.push(`EmployeeId eq ${payrollClient.id(employeeId)}`);
    if (fromDate)
      filters.push(
        `StartTime ge datetime'${z.iso.date().parse(fromDate)}T00:00:00'`
      );
    if (toDate)
      filters.push(
        `StartTime lt datetime'${z.iso.date().parse(toDate)}T00:00:00'`
      );
    if (fromDate && toDate && fromDate >= toDate)
      throw new Error('Date Until must be after Date From.');
    if (filter) filters.push(`(${filter})`);
    const records = await payrollClient.list({
      apiKey: context.auth.secret_text,
      path: payrollClient.businessPath({ businessId, resource: 'timesheet' }),
      limit,
      offset,
      filter: filters.join(' and '),
    });
    return payrollOutput.rows(records);
  },
});
