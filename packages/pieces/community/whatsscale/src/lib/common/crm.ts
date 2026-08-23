export type ConductorCrmContact = {
  id: string;
  phone: string;
  name: string | null;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
};

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
