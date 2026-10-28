import { createAction, Property } from '@activepieces/pieces-framework';
import { callsyncAuth } from '../auth';
import { callsyncListAll, flatten } from '../common/client';
import { stageDropdown } from '../common/props';

export const findContacts = createAction({
  auth: callsyncAuth,
  name: 'find_contacts',
  classification: 'SEARCH',
  displayName: 'Find Contacts',
  description: 'Finds CallSync CRM contacts by name, phone, email or note.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search CallSync CRM contacts by a term matching name, phone, email or sales note, optionally by stage or label; returns the most recently updated first. Use it to get a contact id before creating a task or note. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Matches name, phone, email and sales note.',
      required: false,
    }),
    stage_id: stageDropdown(),
    label: Property.ShortText({ displayName: 'Label', required: false }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Most contacts to return.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { search, stage_id, label, limit } = context.propsValue;
    const contacts = await callsyncListAll({
      apiKey: context.auth.secret_text,
      path: 'crm/contacts',
      query: { search: search ?? undefined, stage_id: stage_id ?? undefined, label: label ?? undefined },
      limit: limit ?? 25,
    });
    return contacts.map((contact) => flatten(contact));
  },
});
