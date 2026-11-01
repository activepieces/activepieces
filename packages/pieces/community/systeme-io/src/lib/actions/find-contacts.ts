import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { SystemeContact, systemeIoCommon, systemeIoInput } from '../common/client';
import { systemeIoAuthTagOptions } from '../common/dropdowns';
import { findContactsActionOutputSchema } from '../output-schemas';

export const findContacts = createAction({
  auth: systemeIoAuth,
  name: 'find_contacts',
  classification: 'SEARCH',
  displayName: 'Find Contacts',
  description: 'Search contacts by email, tags, sign-up date or status',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Systeme.io contacts matching optional filters: email (exact, case-insensitive), tag ids (contacts must have all of them), a registration date range, and unsubscribed/bounced/needs-confirmation status; with no filters it lists every contact, newest first (Systeme.io ignores any other order). Use to build a segment or check who matches before tagging or enrolling; use Find Contact by Email for a single lookup. Pages automatically up to Max Results and returns a cursor to continue. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Optional email address, matched exactly but ignoring case, e.g. "jane@example.com".',
      required: false,
    }),
    tag_ids: Property.MultiSelectDropdown({
      auth: systemeIoAuth,
      displayName: 'Has All Tags',
      description: 'Optional. Only contacts that have every selected tag. Agents can pass numeric tag ids.',
      required: false,
      refreshers: [],
      refreshOnSearch: true,
      options: async ({ auth }, ctx) => systemeIoAuthTagOptions({ apiKey: auth?.secret_text, searchValue: ctx?.searchValue }),
    }),
    registered_after: Property.DateTime({
      displayName: 'Registered After',
      description: 'Optional ISO 8601 date-time, e.g. "2026-01-01T00:00:00Z".',
      required: false,
    }),
    registered_before: Property.DateTime({
      displayName: 'Registered Before',
      description: 'Optional ISO 8601 date-time, e.g. "2026-02-01T00:00:00Z".',
      required: false,
    }),
    unsubscribed: statusFilter({ displayName: 'Unsubscribed', yes: 'unsubscribed from emails', no: 'still subscribed to emails' }),
    bounced: statusFilter({ displayName: 'Bounced', yes: 'whose emails bounced', no: 'whose emails did not bounce' }),
    needs_confirmation: statusFilter({
      displayName: 'Needs Confirmation',
      yes: 'who still have to confirm their opt-in',
      no: 'who do not need to confirm their opt-in',
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'How many contacts to return at most (1-1000). Default 100.',
      required: false,
      defaultValue: 100,
    }),
    starting_after: Property.ShortText({
      displayName: 'Continue After (cursor)',
      description: 'Optional. The Next Cursor value from a previous run, to fetch the following contacts.',
      required: false,
    }),
  },
  outputSchema: findContactsActionOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const maxResults = systemeIoInput.clampInt({ value: p.max_results, name: 'Max Results', min: 1, max: 1000, fallback: 100 });
    const tagIds = systemeIoInput.idList({ value: p.tag_ids, name: 'Tag ID' });
    const page = await systemeIoCommon.paginate<SystemeContact>({
      auth: context.auth.secret_text,
      url: '/contacts',
      maxItems: maxResults,
      startingAfter: systemeIoInput.optionalId({ value: p.starting_after, name: 'Continue After' }),
      query: {
        email: p.email?.trim() || undefined,
        tags: tagIds.length > 0 ? tagIds.join(',') : undefined,
        registeredAfter: isoOrUndefined({ value: p.registered_after, name: 'Registered After' }),
        registeredBefore: isoOrUndefined({ value: p.registered_before, name: 'Registered Before' }),
        unsubscribed: triState(p.unsubscribed),
        bounced: triState(p.bounced),
        needsConfirmation: triState(p.needs_confirmation),
      },
    });
    return {
      contacts: page.items,
      count: page.items.length,
      has_more: page.hasMore,
      next_cursor: page.nextCursor,
    };
  },
});

function statusFilter({ displayName, yes, no }: { displayName: string; yes: string; no: string }) {
  return Property.StaticDropdown({
    displayName,
    description: `Optional. Yes: only contacts ${yes}. No: only contacts ${no}. Leave empty for both.`,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function triState(value: unknown): string | undefined {
  if (value === 'yes' || value === true || value === 'true') return 'true';
  if (value === 'no' || value === false || value === 'false') return 'false';
  return undefined;
}

function isoOrUndefined({ value, name }: { value: unknown; name: string }): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${name} must be an ISO 8601 date-time, e.g. "2026-01-01T00:00:00Z".`);
  }
  return date.toISOString();
}
