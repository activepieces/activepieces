import { createAction, Property } from '@activepieces/pieces-framework';
import { sperseAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getContactDetails = createAction({
  name: 'getContactDetails',
  displayName: 'Get Contact Details',
  description: 'Get Contact Details',
  audience: 'both',
  aiMetadata: {
    description:
      "Looks up a single contact's full record in Sperse CRM. Identify the contact by any one of Contact ID, Contact Xref, Affiliate Code, User ID, or User Email (only the provided identifiers are sent as query parameters). Use this to read contact data before acting on it. Idempotent: a read-only lookup with no side effects.",
    idempotent: true,
  },
  auth: sperseAuth,
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
    userEmail: Property.LongText({
      displayName: 'User Email',
      required: false,
      description: 'Email of the logged in user',
    }),
  },
  async run(context) {
    const contact = {
      contactId: context.propsValue.contactId,
      xref: context.propsValue.xref,
      affiliateCode: context.propsValue.affiliateCode,
      userId: context.propsValue.userId,
      userEmail: context.propsValue.userEmail,
    };

    // Filter out keys with undefined values
    const filteredContact: Record<string, string | number> = Object.fromEntries(
      Object.entries(contact).filter(([, value]) => value !== undefined)
    ) as Record<string, string | number>; // Cast to ensure it's the correct type

    // Create query parameters from the filtered contact object
    const queryParams = new URLSearchParams(
      Object.entries(filteredContact).map(([key, value]) => [
        key,
        String(value),
      ])
    );

    // Send GET request with query parameters in the URL
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${
        context.auth.props.base_url
      }/api/services/CRM/Contact/GetContactData?${queryParams.toString()}`,
      headers: {
        'api-key': context.auth.props.api_key,
        'Content-Type': 'application/json',
      },
    });

    return {
      status: res.status,
      body: res.body,
    };
  },
});
