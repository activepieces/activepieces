import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroFindOrCreateContact = createAction({
  auth: xeroAuth,
  name: 'xero_find_or_create_contact',
  displayName: 'Find or Create Contact',
  description: 'Finds or creates a specific contact.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a Xero contact by exact name and return it if it exists, otherwise create it. Pick this to de-duplicate contacts before invoicing so re-runs reuse the same record instead of creating duplicates. Idempotent on the contact name: the same name always resolves to the same contact.',
    idempotent: true,
  },
  props: {
    tenant_id: props.tenant_id,
    name: props.contact_name(true),
    email: props.contact_email(false),
  },
  async run(context) {
    const { tenant_id, name, email } = context.propsValue;

    const baseUrl = 'https://api.xero.com/api.xro/2.0/Contacts';
    const where = `Name="${name?.replace(/"/g, '\\"')}"`;

    const findRequest: HttpRequest = {
      method: HttpMethod.GET,
      url: `${baseUrl}?where=${encodeURIComponent(where)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: { 'Xero-Tenant-Id': tenant_id },
    };

    const found = await httpClient.sendRequest<{ Contacts?: unknown[] }>(findRequest);
    if (found.status === 200 && (found.body.Contacts?.length ?? 0) > 0) {
      return found.body;
    }

    const createRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: baseUrl,
      body: {
        Contacts: [
          {
            Name: name,
            ...(email ? { EmailAddress: email } : {}),
          },
        ],
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: { 'Xero-Tenant-Id': tenant_id },
    };

    const created = await httpClient.sendRequest(createRequest);
    if (created.status === 200) {
      return created.body;
    }
    return created;
  },
});
