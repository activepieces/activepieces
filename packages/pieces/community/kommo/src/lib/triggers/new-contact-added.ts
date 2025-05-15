import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

type KommoContact = {
  id: number;
  name?: string;
  [key: string]: unknown;
};

export const newContactAddedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'new_contact_added',
  displayName: 'New Contact Added',
  description: 'Triggered when a contact is added to Kommo.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 999999,
    name: 'John Doe',
  },
  async onEnable() {
    // Required for polling triggers — no setup needed at this time
  },
  async onDisable() {
    // Required for polling triggers — no cleanup needed at this time
  },
  async run(context) {
    const { subdomain, apiToken } = context.auth as {
      subdomain: string;
      apiToken: string;
    };

    const contacts = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.GET,
      `/contacts?limit=50&order=created_at_desc`
    );

    const newContacts = contacts._embedded.contacts as KommoContact[];

    return newContacts.map((contact) => ({
      id: contact.id.toString(),
      data: contact,
    }));
  },
});
