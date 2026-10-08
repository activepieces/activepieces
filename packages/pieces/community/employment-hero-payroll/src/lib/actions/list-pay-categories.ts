import { createAction } from '@activepieces/pieces-framework';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollClient } from '../common/client';
import { payrollOutput } from '../common/output';
import { payrollProperties } from '../common/properties';

export const listPayCategories = createAction({
  name: 'list_pay_categories',
  classification: 'SEARCH',
  displayName: 'List Pay Categories',
  description: 'Lists a page of pay categories.',
  auth: employmentHeroPayrollAuth,
  audience: 'both',
  aiMetadata: {
    description:
      'Lists a page of pay categories. Use Offset to retrieve subsequent pages. Safe to retry.',
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
        resource: 'paycategory',
      }),
      limit: context.propsValue.limit,
      offset: context.propsValue.offset,
      filter: context.propsValue.filter,
    });
    return payrollOutput.rows(records);
  },
});
