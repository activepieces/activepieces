import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxClient } from './client';
import type { SendfoxAuthValue, SendfoxContact } from './types';

async function createContact({
  auth,
  email,
  firstName,
  lastName,
  ipAddress,
  lists,
  contactFields,
}: CreateContactParams & { auth: SendfoxAuthValue }): Promise<SendfoxContact> {
  return await sendfoxClient.request<SendfoxContact>({
    auth,
    method: HttpMethod.POST,
    path: '/contacts',
    body: {
      email,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(ipAddress ? { ip_address: ipAddress } : {}),
      ...(lists && lists.length > 0 ? { lists } : {}),
      ...(contactFields && contactFields.length > 0
        ? { contact_fields: contactFields }
        : {}),
    },
  });
}

export const sendfoxApi = { createContact };

type CreateContactParams = {
  email: string;
  firstName?: string;
  lastName?: string;
  ipAddress?: string;
  lists?: (string | number)[];
  contactFields?: unknown[];
};
