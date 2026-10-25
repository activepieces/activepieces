import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';

export const getContactAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact',
  displayName: 'Get Contact',
  description: 'Gets a Zoho Books contact (customer or vendor) by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one customer or vendor by contact_id, with its addresses, contact persons, balances and custom fields. Use List Contacts to find a contact_id by name or email.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksApi.getContact({
      auth: context.auth,
      organizationId,
      contactId: context.propsValue.contactId,
    });
  },
});
