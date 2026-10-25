import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const updateContactPersonAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_contact_person',
  displayName: 'Update Contact Person',
  description: 'Updates a contact person of a Zoho Books customer or vendor.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a contact person; only the fields given are sent besides the contact ID. Use Get Contact Person to read the current values.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({
      required: true,
      description:
        'ID of the contact the person belongs to, from List Contacts or Get Contact Person.',
    }),
    contactPersonId: zohoBooksAiProps.contactPersonId({ required: true }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    salutation: Property.ShortText({
      displayName: 'Salutation',
      description: 'e.g. "Mr".',
      required: false,
    }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'e.g. "+1-925-921-9201".',
      required: false,
    }),
    mobile: Property.ShortText({ displayName: 'Mobile', required: false }),
    skype: Property.ShortText({ displayName: 'Skype', required: false }),
    designation: Property.ShortText({
      displayName: 'Designation',
      description: 'e.g. "Sales Engineer".',
      required: false,
    }),
    department: Property.ShortText({
      displayName: 'Department',
      description: 'e.g. "Sales".',
      required: false,
    }),
    enablePortal: zohoBooksAiProps.flag({
      displayName: 'Enable Portal',
      description: 'Gives the person access to the client portal.',
      required: false,
    }),
    isPrimaryContact: zohoBooksAiProps.flag({
      displayName: 'Is Primary Contact',
      description: 'Makes the person the primary contact person of the contact.',
      required: false,
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other contact person fields, e.g. {"communication_preference": {"is_sms_enabled": true, "is_whatsapp_enabled": false}}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      contactId,
      contactPersonId,
      firstName,
      lastName,
      salutation,
      email,
      phone,
      mobile,
      skype,
      designation,
      department,
      enablePortal,
      isPrimaryContact,
      additionalFields,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/contacts/contactpersons/${encodeURIComponent(contactPersonId)}`,
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        contact_id: contactId,
        ...spreadIfDefined('first_name', firstName),
        ...spreadIfDefined('last_name', lastName),
        ...spreadIfDefined('salutation', salutation),
        ...spreadIfDefined('email', email),
        ...spreadIfDefined('phone', phone),
        ...spreadIfDefined('mobile', mobile),
        ...spreadIfDefined('skype', skype),
        ...spreadIfDefined('designation', designation),
        ...spreadIfDefined('department', department),
        ...spreadIfDefined('enable_portal', zohoBooksUtils.toBoolean({ value: enablePortal })),
        ...spreadIfDefined(
          'is_primary_contact',
          zohoBooksUtils.toBoolean({ value: isPrimaryContact }),
        ),
      },
    });
  },
});
