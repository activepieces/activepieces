import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';
import { sageIntacctDropdowns } from '../common/dropdowns';

export const upsertProjectResourceAction = createAction({
  auth: sageIntacctAuth,
  name: 'upsert_project_resource',
  classification: 'WRITE',
  displayName: 'Create or Update Project Resource',
  description: 'Creates a new project resource in Sage Intacct, or updates an existing one.',
  audience: 'both',
  aiMetadata: {
    description:
      'Assign an employee or item to a project as a billable resource, with optional labor/expense/purchasing rates. Select an existing project resource to update it in place; leave it blank to create a new one. Creating without selecting an existing resource makes a new one each call, so retries can duplicate.',
    idempotent: false,
  },
  props: {
    projectResource: sageIntacctDropdowns.projectResourceByKey,
    project: sageIntacctDropdowns.projectByKey,
    employee: sageIntacctDropdowns.employeeByKey,
    item: sageIntacctDropdowns.itemByKey,
    startDate: Property.DateTime({ displayName: 'Start Date', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    laborRate: Property.Number({ displayName: 'Labor Rate', required: false }),
    expenseRate: Property.Number({ displayName: 'Expense Rate', required: false }),
    apPurchasingRate: Property.Number({ displayName: 'AP Purchasing Rate', required: false }),
  },
  async run(context) {
    const {
      projectResource,
      project,
      employee,
      item,
      startDate,
      description,
      laborRate,
      expenseRate,
      apPurchasingRate,
    } = context.propsValue;

    const hasPricing = laborRate !== undefined || expenseRate !== undefined || apPurchasingRate !== undefined;

    const body = {
      project: { key: project },
      ...(employee ? { employee: { key: employee } } : {}),
      ...(item ? { item: { key: item } } : {}),
      ...spreadIfDefined('startDate', startDate ? sageIntacctClient.toDate(startDate) : undefined),
      ...spreadIfDefined('description', description),
      ...(hasPricing
        ? {
            pricing: {
              ...spreadIfDefined('laborRate', laborRate),
              ...spreadIfDefined('expenseRate', expenseRate),
              ...spreadIfDefined('apPurchasingRate', apPurchasingRate),
            },
          }
        : {}),
    };

    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: projectResource ? HttpMethod.PATCH : HttpMethod.POST,
      path: projectResource
        ? `/objects/${sageIntacctClient.objects.projectResource}/${projectResource}`
        : `/objects/${sageIntacctClient.objects.projectResource}`,
      body,
    });
  },
});
