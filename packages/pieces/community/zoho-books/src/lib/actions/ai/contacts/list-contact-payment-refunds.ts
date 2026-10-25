import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const listContactPaymentRefundsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_contact_payment_refunds',
  displayName: 'List Contact Payment Refunds',
  description: 'Lists the customer payment refunds of a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the refunds of customer payments made to a contact. For refunds of credit notes use List Contact Credit Note Refunds. Returns one page; page_context.has_more_page tells whether to fetch the next page.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    page: zohoBooksAiProps.page(),
    perPage: zohoBooksAiProps.perPage(),
  },
  async run(context) {
    const { contactId, page, perPage } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contacts/${encodeURIComponent(contactId)}/paymentrefunds`,
      query: { organization_id: organizationId, ...zohoBooksUtils.pageQuery({ page, perPage }) },
    });
  },
});
