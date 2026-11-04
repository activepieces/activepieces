import { HttpMethod } from '@activepieces/pieces-common';

import { zohoBooksClient } from './client';

import type {
  ZohoBooksAuthValue,
  ZohoBooksContactResponse,
  ZohoBooksOrganizationsResponse,
} from './types';

async function listOrganizations({
  auth,
}: {
  auth: ZohoBooksAuthValue;
}): Promise<ZohoBooksOrganizationsResponse> {
  return await zohoBooksClient.request<ZohoBooksOrganizationsResponse>({
    auth,
    method: HttpMethod.GET,
    path: '/organizations',
  });
}

async function resolveOrganizationId({
  auth,
  organizationId,
}: {
  auth: ZohoBooksAuthValue;
  organizationId?: string;
}): Promise<string> {
  if (organizationId) {
    return organizationId;
  }
  const { organizations = [] } = await listOrganizations({ auth });
  const organization = organizations.find((org) => org.is_default_org) ?? organizations[0];
  if (!organization) {
    throw new Error(
      'Organization ID was not given and this Zoho Books connection has no organizations. Create an organization in Zoho Books, or pass Organization ID.',
    );
  }
  return organization.organization_id;
}

async function getContact({
  auth,
  organizationId,
  contactId,
}: {
  auth: ZohoBooksAuthValue;
  organizationId: string;
  contactId: string;
}): Promise<ZohoBooksContactResponse> {
  return await zohoBooksClient.request<ZohoBooksContactResponse>({
    auth,
    method: HttpMethod.GET,
    path: `/contacts/${encodeURIComponent(contactId)}`,
    query: { organization_id: organizationId },
  });
}

export const zohoBooksApi = { resolveOrganizationId, getContact };
