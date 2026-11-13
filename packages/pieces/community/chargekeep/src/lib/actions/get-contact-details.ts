import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chargekeepAuth } from '../auth';
import { chargekeepClient } from '../common/client';
import { chargekeepMappers } from '../common/mappers';
import { chargekeepOutputSchemas } from '../common/output-schemas';

export const getContactDetails = createAction({
  name: 'getContactDetails',
  classification: 'READ',
  displayName: 'Get Contact Details',
  description: 'Get a contact by ID, XREF, affiliate code, user ID or user email.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up and returns one contact record from the ChargeKeep/Sperse CRM: name parts, contact group, emails, phones, addresses, tags, lists, XREFs and custom fields. Pass at least one identifier: Contact ID, Contact Xref, Affiliate Code, User ID (portal user, not contact) or User Email. Use Search Contacts first when you only have a name. Read-only and safe to repeat.',
    idempotent: true,
  },
  outputSchema: chargekeepOutputSchemas.contact,
  auth: chargekeepAuth,
  props: {
    contactId: Property.Number({
      displayName: 'Contact Id',
      required: false,
    }),
    xref: Property.ShortText({
      displayName: 'Contact Xref',
      required: false,
    }),
    affiliateCode: Property.ShortText({
      displayName: 'Affiliate Code',
      required: false,
    }),
    userId: Property.Number({
      displayName: 'User Id',
      required: false,
      description: 'Id of the logged in user (not contact id)',
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      required: false,
      description: 'Email of the logged in user',
    }),
  },
  async run(context) {
    const query = {
      contactId: chargekeepClient.positiveId({ value: context.propsValue.contactId, label: 'Contact Id' }),
      xref: chargekeepClient.text(context.propsValue.xref),
      affiliateCode: chargekeepClient.text(context.propsValue.affiliateCode),
      userId: chargekeepClient.positiveId({ value: context.propsValue.userId, label: 'User Id' }),
      userEmail: chargekeepClient.text(context.propsValue.userEmail),
    };
    if (Object.values(query).every((v) => v === undefined)) {
      throw new Error('Provide at least one of Contact Id, Contact Xref, Affiliate Code, User Id or User Email.');
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
