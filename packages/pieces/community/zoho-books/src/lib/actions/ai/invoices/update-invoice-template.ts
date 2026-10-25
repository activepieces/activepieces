import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateInvoiceTemplateAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_invoice_template',
  displayName: 'Update Invoice Template',
  description: 'Changes the PDF template of an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the PDF template used for one invoice. The template_id comes from List Invoice Templates.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'Invoice template ID, from List Invoice Templates.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, templateId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoices/${encodeURIComponent(invoiceId)}/templates/${encodeURIComponent(
        templateId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
