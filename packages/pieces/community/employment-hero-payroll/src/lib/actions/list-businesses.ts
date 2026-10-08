import { createAction } from '@activepieces/pieces-framework';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollClient } from '../common/client';
import { payrollOutput } from '../common/output';
import { payrollProperties } from '../common/properties';

export const listBusinesses = createAction({
  name: 'list_businesses',
  classification: 'SEARCH',
  displayName: 'List Businesses',
  description: 'Lists a page of businesses.',
  auth: employmentHeroPayrollAuth,
  audience: 'both',
  aiMetadata: {
    description:
      'Lists a page of businesses. Use Offset to retrieve subsequent pages. Safe to retry.',
    idempotent: true,
  },
  props: { ...payrollProperties.pagination },
  async run(context) {
    const records = await payrollClient.list({
      apiKey: context.auth.secret_text,
      path: '/business',
      limit: context.propsValue.limit,
      offset: context.propsValue.offset,
      filter: context.propsValue.filter,
    });
    return payrollOutput.rows(records);
  },
});
