import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const enableContactPortalAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_enable_contact_portal',
  displayName: 'Enable Contact Portal',
  description: 'Gives contact persons of a Zoho Books contact access to the customer portal.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Turns on customer portal access for the given contact persons of one contact. Needs the customer portal enabled in Zoho Books settings. Use Disable Contact Portal to turn it off.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    contactPersonIds: Property.Array({
      displayName: 'Contact Person IDs',
      description:
        'Contact person IDs of this contact to give portal access, from List Contact Persons, e.g. ["460000000026051"].',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, contactPersonIds } = context.propsValue;
    const contactPersonIdsList = zohoBooksUtils.toStringList({
      value: contactPersonIds,
      propName: 'Contact Person IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/portal/enable`,
      query: { organization_id: organizationId },
      body: { contact_persons: contactPersonIdsList.map((id) => ({ contact_person_id: id })) },
    });
  },
});
