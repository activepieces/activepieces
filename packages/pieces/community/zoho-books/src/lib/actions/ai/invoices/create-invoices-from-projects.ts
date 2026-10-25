import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const createInvoicesFromProjectsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_invoices_from_projects',
  displayName: 'Create Invoices From Projects',
  description: 'Creates Zoho Books invoices from the unbilled time and expenses of projects.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Bills the unbilled time and expenses of the given billable projects as new invoices and returns them with their invoice_id. Each call creates new invoices, so do not repeat it for the same projects.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    projectIds: Property.Array({
      displayName: 'Project IDs',
      description: 'IDs of billable projects, from Zoho Books (the project_id of each project).',
      required: true,
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description:
        'Invoice number to give the created invoice, up to 30 characters. Leave empty for auto-numbering.',
      required: false,
    }),
  },
  async run(context) {
    const { projectIds, invoiceNumber } = context.propsValue;
    const projectIdsList = zohoBooksUtils.toStringList({
      value: projectIds,
      propName: 'Project IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/invoices/fromprojects',
      query: {
        organization_id: organizationId,
        project_ids: projectIdsList.join(','),
        invoice_number: invoiceNumber,
      },
    });
  },
});
