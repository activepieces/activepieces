import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactByReferenceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_by_reference',
  displayName: 'Get Contact By Reference',
  description: 'Gets a Zoho Books contact by its reference ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the contact that has the given reference ID, including its contact_id. Use Get Contact when the contact_id is already known.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    referenceId: Property.ShortText({
      displayName: 'Reference ID',
      description: 'Numeric reference ID of the contact.',
      required: true,
    }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contacts/reference/${encodeURIComponent(context.propsValue.referenceId)}`,
      query: { organization_id: organizationId },
    });
  },
});
