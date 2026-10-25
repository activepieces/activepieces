import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactPersonAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_person',
  displayName: 'Get Contact Person',
  description: 'Gets a contact person of a Zoho Books customer or vendor.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one contact person of a contact by ID, with name, email, phones and primary status.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({
      required: true,
      description: 'ID of the contact the person belongs to, from List Contacts or Create Contact.',
    }),
    contactPersonId: zohoBooksAiProps.contactPersonId({ required: true }),
  },
  async run(context) {
    const { contactId, contactPersonId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contacts/${encodeURIComponent(contactId)}/contactpersons/${encodeURIComponent(
        contactPersonId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
