import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateContactTaxInfoAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_contact_tax_info',
  displayName: 'Update Contact Tax Info',
  description: 'Updates a tax registration record of a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates one tax registration record of a contact; only the fields given are sent. Tax info IDs come from List Contact Tax Info or Add Contact Tax Info. The fields accepted depend on the organization edition (country).',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    taxInfoId: Property.ShortText({
      displayName: 'Tax Info ID',
      description: 'Tax info ID, from List Contact Tax Info or Add Contact Tax Info.',
      required: true,
    }),
    taxInfo: Property.Json({
      displayName: 'Tax Info',
      description:
        'Tax registration fields to change, e.g. {"tax_reg_no": "100000000000003"} (GCC) or {"gst_no": "22AAAAA0000A1Z5", "place_of_contact": "TN"} (India).',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, taxInfoId, taxInfo } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/contacts/${encodeURIComponent(contactId)}/taxinfo/${encodeURIComponent(taxInfoId)}`,
      query: { organization_id: organizationId },
      body: taxInfo,
    });
  },
});
