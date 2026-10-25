import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const resendContactPersonPortalInviteAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_resend_contact_person_portal_invite',
  displayName: 'Resend Contact Person Portal Invite',
  description: 'Resends the customer portal invitation to a Zoho Books contact person.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails the customer portal invitation again to a contact person invited with Invite Contact Person to Portal. Needs the customer portal enabled in Zoho Books settings. Each call sends an email.',
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
      )}/portal/invite/resend`,
      query: { organization_id: organizationId },
    });
  },
});
