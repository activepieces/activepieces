import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroArchiveContact = createAction({
  auth: xeroAuth,
  name: 'xero_archive_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Contact',
  description: 'Archives a contact so it no longer appears in contact lists.',
  audience: 'both',
  aiMetadata: {
    description:
      'Archives a Xero contact by ContactID, hiding it from contact lists and new transactions; Xero does not allow deleting contacts. Xero refuses to archive a contact with outstanding balances or linked repeating invoices (even deleted ones). Idempotent: archiving an already archived contact leaves it archived.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.contact,
  props: {
    tenant_id: props.tenant_id,
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The Xero ContactID (a GUID) of the contact to archive.',
      required: true,
    }),
  },
  async run(context) {
    return archiveContact({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      contactId: xeroInput.requiredText({ value: context.propsValue.contact_id, field: 'Contact ID' }),
    });
  },
});

async function archiveContact({ accessToken, tenantId, contactId }: { accessToken: string; tenantId: string; contactId: string }) {
  const body = await xeroApi.request<unknown>({
    accessToken,
    tenantId,
    method: HttpMethod.POST,
    url: `${XERO_URLS.api}/Contacts/${encodeURIComponent(contactId)}`,
    body: { Contacts: [{ ContactID: contactId, ContactStatus: 'ARCHIVED' }] },
    operation: 'archive contact',
  });
  return xeroApi.firstRecord({ body, key: 'Contacts', operation: 'archive contact' });
}
