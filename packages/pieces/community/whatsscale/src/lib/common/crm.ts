import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleClient } from './client';

export function flattenCrmContact(contact: ConductorCrmContact) {
  return {
    id: contact.id,
    phone: contact.phone,
    name: contact.name,
    tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : null,
    source: contact.source,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
  };
}

export async function addTagsToCrmContact({
  apiKey,
  contactId,
  tags,
}: AddTagsToCrmContactParams): Promise<ConductorCrmContact> {
  const normalized = tags
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  if (normalized.length === 0) {
    throw new Error('Provide at least one tag to add.');
  }

  let contact = await postCrmContactTag({ apiKey, contactId, tag: normalized[0] });
  for (const tag of normalized.slice(1)) {
    contact = await postCrmContactTag({ apiKey, contactId, tag });
  }
  return contact;
}

async function postCrmContactTag({
  apiKey,
  contactId,
  tag,
}: PostCrmContactTagParams): Promise<ConductorCrmContact> {
  const response = await whatsscaleClient(
    apiKey,
    HttpMethod.POST,
    `/api/crm/contacts/${contactId}/tags`,
    { tag }
  );
  return response.body as ConductorCrmContact;
}

export type ConductorCrmContact = {
  id: string;
  phone: string;
  name: string | null;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
};

export type AddTagsToCrmContactParams = {
  apiKey: string;
  contactId: string;
  tags: unknown[];
};

type PostCrmContactTagParams = {
  apiKey: string;
  contactId: string;
  tag: string;
};
