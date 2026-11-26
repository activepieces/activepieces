import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chargekeepAuth } from '../auth';
import { chargekeepClient } from '../common/client';
import { chargekeepMappers } from '../common/mappers';
import { chargekeepOutputSchemas } from '../common/output-schemas';

export const getContactDetails = createAction({
  name: 'getContactDetails',
  classification: 'READ',
  displayName: 'Get Contact Details',
  description: 'Finds a contact by ID, external ID, affiliate code or portal user.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up and returns one contact record from the ChargeKeep/Sperse CRM: name parts, contact group, emails, phones, addresses, tags, lists, XREFs and custom fields. Pass at least one identifier: Contact ID, Contact Xref, Affiliate Code, User ID (portal user, not contact) or User Email. Use Search Contacts first when you only have a name. Read-only and safe to repeat.',
    idempotent: true,
  },
  outputSchema: chargekeepOutputSchemas.contact,
  auth: chargekeepAuth,
  propertyGroups: [
    {
      key: 'find',
      display: 'section',
      label: 'Find Contact',
      icon: 'user',
      props: ['lookup_info', 'contactId', 'xref', 'affiliateCode', 'userId', 'userEmail'],
    },
  ],
  props: {
    lookup_info: Property.MarkDown({
      value: 'Give any one of these to find the contact.',
      variant: MarkdownVariant.INFO,
    }),
    contactId: Property.Number({
      displayName: 'Contact ID',
      required: false,
      width: 'half',
    }),
    xref: Property.ShortText({
      displayName: 'External Contact ID',
      required: false,
      width: 'half',
    }),
    affiliateCode: Property.ShortText({
      displayName: 'Affiliate Code',
      description: "The contact's affiliate code.",
      required: false,
    }),
    userId: Property.Number({
      displayName: 'Portal User ID',
      required: false,
      description: "ID of the contact's login, not the Contact ID.",
      width: 'half',
    }),
    userEmail: Property.ShortText({
      displayName: 'Portal User Email',
      required: false,
      description: 'Email the contact uses to sign in to ChargeKeep.',
      width: 'half',
    }),
  },
  async run(context) {
    const query = {
      contactId: chargekeepClient.positiveId({ value: context.propsValue.contactId, label: 'Contact ID' }),
      xref: chargekeepClient.text(context.propsValue.xref),
      affiliateCode: chargekeepClient.text(context.propsValue.affiliateCode),
      userId: chargekeepClient.positiveId({ value: context.propsValue.userId, label: 'Portal User ID' }),
      userEmail: chargekeepClient.text(context.propsValue.userEmail),
    };
    if (Object.values(query).every((v) => v === undefined)) {
      throw new Error('Provide at least one of Contact ID, External Contact ID, Affiliate Code, Portal User ID or Portal User Email.');
    }
    const res = await chargekeepClient.send({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/services/CRM/Contact/GetContactData',
      query,
    });
    return chargekeepMappers.contact(res.result);
  },
});
