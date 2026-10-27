import { Property } from '@activepieces/pieces-framework';
import { arteemisAuth } from '../auth';
import { arteemisApi } from './client';

type ContactList = { id: string; name: string; kind: string; members: number };
type Campaign = { id: string; name: string; status: string };
type Pipeline = { columns: { id: string; name: string }[] };

// campaigns_find answers 50 campaigns a page; 5 pages cover the campaigns not archived.
const CAMPAIGN_PAGE_SIZE = 50;
const MAX_CAMPAIGN_PAGES = 5;

const CONNECT_FIRST = { disabled: true, options: [], placeholder: 'Connect your Arteemis account first' };
const LOAD_FAILED = { disabled: true, options: [], placeholder: 'Could not load the options. Check the connection.' };

export const contactIdProp = (description?: string) =>
  Property.ShortText({
    displayName: 'Contact ID',
    description:
      description ??
      'The Arteemis contact ID, e.g. `5b8f1c7e-2a4d-4e8b-9c3f-1d2e3f4a5b6c`. Map it from **Create or Update Contact**, **Find Contact** or a trigger (`contact_id`).',
    required: true,
  });

export const listDropdown = ({ required, description }: { required: boolean; description: string }) =>
  Property.Dropdown({
    auth: arteemisAuth,
    displayName: 'List',
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return CONNECT_FIRST;
      }
      try {
        const { data } = await arteemisApi.call<ContactList[]>({ apiKey: auth.secret_text, tool: 'contact_lists_list' });
        // People go into person lists; organization lists take organizations only.
        return {
          disabled: false,
          options: data
            .filter((list) => list.kind === 'person')
            .map((list) => ({ label: `${list.name} (${list.members})`, value: list.id })),
        };
      } catch {
        return LOAD_FAILED;
      }
    },
  });

export const campaignDropdown = Property.Dropdown({
  auth: arteemisAuth,
  displayName: 'Campaign',
  description: 'The campaign that sends its sequence to the contact. Archived campaigns are not listed.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return CONNECT_FIRST;
    }
    try {
      const options: { label: string; value: string }[] = [];
      let cursor: string | null | undefined;
      for (let page = 0; page < MAX_CAMPAIGN_PAGES; page++) {
        const response = await arteemisApi.call<{ rows: Campaign[] }>({
          apiKey: auth.secret_text,
          tool: 'campaigns_find',
          body: arteemisApi.filled({ limit: CAMPAIGN_PAGE_SIZE, cursor }),
        });
        options.push(...response.data.rows.map((row) => ({ label: `${row.name} (${row.status})`, value: row.id })));
        cursor = response.next_cursor;
        if (!cursor) {
          break;
        }
      }
      return { disabled: false, options };
    } catch {
      return LOAD_FAILED;
    }
  },
});

export const stageDropdown = Property.Dropdown({
  auth: arteemisAuth,
  displayName: 'Stage',
  description: 'The pipeline stage to put the contact in. Leave empty to add the contact to the first stage.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return CONNECT_FIRST;
    }
    try {
      const { data } = await arteemisApi.call<Pipeline>({ apiKey: auth.secret_text, tool: 'deals_list' });
      return { disabled: false, options: data.columns.map((column) => ({ label: column.name, value: column.id })) };
    } catch {
      return LOAD_FAILED;
    }
  },
});
