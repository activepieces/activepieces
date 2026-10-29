import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroGetContact = createAction({
  auth: xeroAuth,
  name: 'xero_get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Gets one contact by ID, with addresses and phone numbers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Xero contact by ContactID with its email, addresses, phones, status and whether it is a customer or supplier. Use Find Contact to look a contact up by name or email first. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.contact,
  props: {
    tenant_id: props.tenant_id,
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The Xero ContactID (a GUID). Use Find Contact to get it.',
      required: true,
    }),
  },
  async run(context) {
    const contactId = xeroInput.pathSegment({ value: context.propsValue.contact_id, field: 'Contact ID' });
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/Contacts/${contactId}`,
      operation: 'get contact',
    });
    return xeroApi.firstRecord({ body, key: 'Contacts', operation: 'get contact' });
  },
});
