import { createAction } from '@activepieces/pieces-framework';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollClient } from '../common/client';
import { payrollOutput } from '../common/output';
import { payrollProperties } from '../common/properties';

export const getEmployee = createAction({
  name: 'get_employee',
  classification: 'READ',
  displayName: 'Get Employee',
  description: 'Retrieves the full details of one employee.',
  auth: employmentHeroPayrollAuth,
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve one known employee by ID. For discovery or basic employee details use List Employees. Safe to retry.',
    idempotent: true,
  },
  props: {
    businessId: payrollProperties.business,
    employeeId: payrollProperties.employee,
  },
  async run(context) {
    const record = await payrollClient.request({
      apiKey: context.auth.secret_text,
      path: payrollClient.businessPath({
        businessId: context.propsValue.businessId,
        resource: `employee/unstructured/${payrollClient.id(
          context.propsValue.employeeId
        )}`,
      }),
    });
    return payrollOutput.flatten(payrollClient.record(record));
  },
});
