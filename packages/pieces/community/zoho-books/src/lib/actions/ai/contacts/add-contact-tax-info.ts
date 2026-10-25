import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const addContactTaxInfoAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_add_contact_tax_info',
  displayName: 'Add Contact Tax Info',
  description: 'Adds a tax registration record to a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a tax registration record to a contact and returns it with its tax_info_id. Each call adds a new record; check List Contact Tax Info first. The fields accepted depend on the organization edition (country).',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    taxInfo: Property.Json({
      displayName: 'Tax Info',
      description:
        'Tax registration fields for the organization edition, e.g. {"tax_treatment": "vat_registered", "tax_reg_no": "100000000000003", "place_of_contact": "DU"} (GCC) or {"gst_treatment": "business_gst", "gst_no": "22AAAAA0000A1Z5", "place_of_contact": "TN"} (India).',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, taxInfo } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/taxinfo`,
      query: { organization_id: organizationId },
      body: taxInfo,
    });
  },
});
