import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const inviteContactPersonToPortalAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_invite_contact_person_to_portal',
  displayName: 'Invite Contact Person to Portal',
  description: 'Sends a customer portal invitation to a Zoho Books contact person.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails a customer portal invitation to one contact person. Needs the customer portal enabled in Zoho Books settings. Each call sends an email; use Resend Contact Person Portal Invite for a person already invited.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactPersonId: zohoBooksAiProps.contactPersonId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/contactpersons/${encodeURIComponent(
        context.propsValue.contactPersonId,
      )}/portal/invite`,
      query: { organization_id: organizationId },
    });
  },
});
