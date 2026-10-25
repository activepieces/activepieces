import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const emailInvoicesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_email_invoices',
  displayName: 'Email Invoices',
  description: 'Emails several invoices to their customers in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails up to 10 invoices at once to the contact persons of their customers, with the default email content. Each call sends the emails again. Use Email Invoice to email one invoice with custom recipients, subject or body.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Up to 10 invoice IDs, from List Invoices or Create Invoice.',
      required: true,
    }),
    contacts: Property.Json({
      displayName: 'Contacts',
      description:
        'Optional per-customer delivery choice, e.g. [{"contact_id": "460000000026049", "email": true, "snail_mail": false}]. contact_id comes from List Contacts.',
      required: false,
    }),
  },
  async run(context) {
    const { invoiceIds, contacts } = context.propsValue;
    const invoiceIdsList = zohoBooksUtils.toStringList({
      value: invoiceIds,
      propName: 'Invoice IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/invoices/email',
      query: { organization_id: organizationId, invoice_ids: invoiceIdsList.join(',') },
      body: { ...spreadIfDefined('contacts', contacts) },
    });
  },
});
