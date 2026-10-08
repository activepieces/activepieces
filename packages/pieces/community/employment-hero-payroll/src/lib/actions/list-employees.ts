import { createAction } from '@activepieces/pieces-framework';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollClient } from '../common/client';
import { payrollOutput } from '../common/output';
import { payrollProperties } from '../common/properties';

export const listEmployees = createAction({
  name: 'list_employees',
  classification: 'SEARCH',
  displayName: 'List Employees',
  description: 'Lists a page of basic employee details.',
  auth: employmentHeroPayrollAuth,
  audience: 'both',
  aiMetadata: {
    description:
      'Lists a page of basic employee details. Use Offset to retrieve subsequent pages. Safe to retry.',
    idempotent: true,
  },
  props: {
    businessId: payrollProperties.business,
    ...payrollProperties.pagination,
  },
  async run(context) {
    const records = await payrollClient.list({
      apiKey: context.auth.secret_text,
      path: payrollClient.businessPath({
        businessId: context.propsValue.businessId,
        resource: 'employee/details',
      }),
      limit: context.propsValue.limit,
      offset: context.propsValue.offset,
      filter: context.propsValue.filter,
    });
    return payrollOutput.rows(records);
  },
});
