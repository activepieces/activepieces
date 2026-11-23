import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { TinkoContact, TinkoCustomField, TinkoItemResponse, tinkoClient } from './client';

function contactId() {
  return Property.ShortText({
    displayName: 'Contact ID',
    description:
      'The Tinko ID of the contact, 26 letters and numbers, for example 01JABCDEFGHJKMNPQRSTVWXYZ0. Map it from the output of Find Contact, Create Contact or a Tinko trigger.',
    required: true,
  });
}

async function get({ token, id }: { token: string; id: string }): Promise<TinkoContact> {
  const response = await tinkoClient.request<TinkoItemResponse<TinkoContact>>({
    token,
    method: HttpMethod.GET,
    path: tinkoClient.pathFor('contacts', id),
  });
  if (!response.data) {
    throw new Error(`Tinko did not return the contact ${id}`);
  }
  return response.data;
}

async function update({
  token,
  id,
  body,
}: {
  token: string;
  id: string;
  body: Record<string, unknown>;
}): Promise<TinkoContact> {
  const response = await tinkoClient.request<TinkoItemResponse<TinkoContact>>({
    token,
    method: HttpMethod.PUT,
    path: tinkoClient.pathFor('contacts', id),
    body,
  });
  if (!response.data) {
    throw new Error(`Tinko did not return the updated contact ${id}`);
  }
  return response.data;
}

async function resolveCustomFields({
  token,
  values,
}: {
  token: string;
  values: Record<string, unknown> | undefined;
}): Promise<Record<string, string>> {
  const filled = Object.entries(values ?? {})
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]): [string, string] => [key, String(value).trim()]);
  if (filled.length === 0) {
    return {};
  }
  const fields = await tinkoClient.listAll<TinkoCustomField>({
    token,
    path: '/contacts/customfields',
  });
  const namesById = new Map(fields.map((field) => [field.id, field.name]));
  return Object.fromEntries(filled.map(([key, value]) => [namesById.get(key) ?? key, value]));
}

function currentCustomFields(contact: TinkoContact): Record<string, unknown> {
  return tinkoClient.isRecord(contact.customfields) ? contact.customfields : {};
}

export const tinkoContact = {
  contactId,
  get,
  update,
  resolveCustomFields,
  currentCustomFields,
};
