import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const createContactPersonAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_contact_person',
  displayName: 'Create Contact Person',
  description: 'Adds a contact person to a Zoho Books customer or vendor.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a contact person to an existing contact and returns it with its contact_person_id. Each call creates a new person; use List Contact Persons first to avoid duplicates. Use Mark Contact Person as Primary to make the person primary.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    firstName: Property.ShortText({ displayName: 'First Name', required: true }),
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
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other contact person fields, e.g. {"communication_preference": {"is_sms_enabled": true, "is_whatsapp_enabled": false}}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      contactId,
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
      additionalFields,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/contacts/contactpersons',
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        contact_id: contactId,
        first_name: firstName,
        ...spreadIfDefined('last_name', lastName),
        ...spreadIfDefined('salutation', salutation),
        ...spreadIfDefined('email', email),
        ...spreadIfDefined('phone', phone),
        ...spreadIfDefined('mobile', mobile),
        ...spreadIfDefined('skype', skype),
        ...spreadIfDefined('designation', designation),
        ...spreadIfDefined('department', department),
        ...spreadIfDefined('enable_portal', zohoBooksUtils.toBoolean({ value: enablePortal })),
      },
    });
  },
});
