import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bitlyAuth } from '../common/auth';
import { bitlyApiCall, BitlyAuthProps, requireGuid } from '../common/client';
import { groupGuid } from '../common/props';
import { BitlyLink, BitlyPagination, newBitlinkOutputSchema } from '../common/schemas';

export const newBitlinkCreatedTrigger = createTrigger({
  auth: bitlyAuth,
  name: 'new_bitlink_created',
  classification: 'READ',
  displayName: 'New Bitlink Created',
  description: 'Fires when a new Bitlink is created.',
  aiMetadata: {
    description: 'Fires when a new Bitlink appears in the selected group, detected by polling. Represents a newly created short link, optionally narrowed to those whose title or tags match a filter and optionally including archived links.',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: newBitlinkOutputSchema,
  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How frequently to check for new Bitlinks.',
      required: false,
      defaultValue: '5',
      options: {
        disabled: false,
        options: [
          { label: 'Every 1 minute', value: '1' },
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
    }),
    
    group_guid: groupGuid,
    
    titleFilter: Property.ShortText({
      displayName: 'Title Filter (Optional)',
      description: 'Only trigger for Bitlinks containing this text in their title.',
      required: false,
    }),
    
    tagFilter: Property.ShortText({
      displayName: 'Tag Filter (Optional)',
      description: 'Only trigger for Bitlinks containing this tag.',
      required: false,
    }),
    
    includeArchived: Property.Checkbox({
      displayName: 'Include Archived Bitlinks',
      description: 'Include archived Bitlinks in monitoring.',
      required: false,
      defaultValue: false,
    }),
  },

  async onEnable(context) {
    if (context.isRepublish && (await context.store.get<PollState>(STATE_KEY))) {
      return;
    }
    const guid = requireGuid({ value: context.propsValue.group_guid, label: 'Group' });
    const response = await bitlyApiCall<{ links?: BitlyLink[] }>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      resourceUri: `/groups/${guid}/bitlinks`,
      query: { size: PAGE_SIZE, archived: 'both' },
      operation: 'list Bitlinks',
    });
    await context.store.put<PollState>(STATE_KEY, nextState({ previous: undefined, links: response.links ?? [] }));
  },

  async onDisable(context) {
    await context.store.delete(STATE_KEY);
    await context.store.delete(LEGACY_STATE_KEY);
  },

  async run(context) {
    const { titleFilter, tagFilter, includeArchived } = context.propsValue;
    const guid = requireGuid({ value: context.propsValue.group_guid, label: 'Group' });
    const state = await context.store.get<PollState>(STATE_KEY);
    const { fresh, newState } = state
      ? await pollSinceCheckpoint({ auth: context.auth.props, guid, state })
      : await pollLegacy({
          auth: context.auth.props,
          guid,
          legacyIds: (await context.store.get<string[]>(LEGACY_STATE_KEY)) ?? undefined,
        });
    await context.store.put<PollState>(STATE_KEY, newState);
    if (!state) {
      await context.store.delete(LEGACY_STATE_KEY);
    }
    const detectedAt = new Date().toISOString();
    return filterLinks({ links: fresh, titleFilter, tagFilter, includeArchived: includeArchived === true })
      .sort((a, b) => createdSeconds(a) - createdSeconds(b))
      .map((link) => toTriggerItem({ link, detectedAt }));
  },

  async test(context) {
    const guid = requireGuid({ value: context.propsValue.group_guid, label: 'Group' });
    const response = await bitlyApiCall<{ links?: BitlyLink[] }>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      resourceUri: `/groups/${guid}/bitlinks`,
      query: { size: 5, archived: context.propsValue.includeArchived ? 'both' : 'off' },
      operation: 'list Bitlinks',
    });
    const detectedAt = new Date().toISOString();
    return (response.links ?? []).map((link) => toTriggerItem({ link, detectedAt }));
  },

  sampleData: {
    id: 'bit.ly/3XYZ123',
    link: 'https://bit.ly/3XYZ123',
    longUrl: 'https://example.com/marketing-campaign-landing-page',
    title: 'Marketing Campaign Landing Page',
    tags: ['marketing', 'campaign', '2025'],
    isArchived: false,
    createdAt: '2025-01-15T09:30:00+0000',
    modifiedAt: '2025-01-15T09:30:00+0000',
    customBitlinks: [],
    references: {
      group: 'Ba1bc23dE4F',
    },
    rawLinkData: {
      id: 'bit.ly/3XYZ123',
      link: 'https://bit.ly/3XYZ123',
      long_url: 'https://example.com/marketing-campaign-landing-page',
      title: 'Marketing Campaign Landing Page',
      tags: ['marketing', 'campaign', '2025'],
      archived: false,
      created_at: '2025-01-15T09:30:00+0000',
      modified_at: '2025-01-15T09:30:00+0000',
      custom_bitlinks: [],
      references: {
        group: 'Ba1bc23dE4F',
      },
    },
    triggerInfo: {
      detectedAt: '2025-01-15T09:30:00.000Z',
      source: 'bitly',
      type: 'new_bitlink',
    },
  },
});

async function pollSinceCheckpoint({
  auth,
  guid,
  state,
}: {
  auth: BitlyAuthProps;
  guid: string;
  state: PollState;
}): Promise<{ fresh: BitlyLink[]; newState: PollState }> {
  const links = await fetchAllSince({ auth, guid, createdAfter: Math.max(0, state.checkpoint - OVERLAP_SECONDS) });
  const fresh = links.filter((link) => state.seen[link.id] === undefined);
  return { fresh, newState: nextState({ previous: state, links }) };
}

async function pollLegacy({
  auth,
  guid,
  legacyIds,
}: {
  auth: BitlyAuthProps;
  guid: string;
  legacyIds: string[] | undefined;
}): Promise<{ fresh: BitlyLink[]; newState: PollState }> {
  const response = await bitlyApiCall<{ links?: BitlyLink[] }>({
    auth,
    method: HttpMethod.GET,
    resourceUri: `/groups/${guid}/bitlinks`,
    query: { size: PAGE_SIZE, archived: 'both' },
    operation: 'list Bitlinks',
  });
  const links = response.links ?? [];
  const known = new Set(legacyIds ?? links.map((link) => link.id));
  return {
    fresh: links.filter((link) => !known.has(link.id)),
    newState: nextState({ previous: undefined, links }),
  };
}

async function fetchAllSince({
  auth,
  guid,
  createdAfter,
}: {
  auth: BitlyAuthProps;
  guid: string;
  createdAfter: number;
}): Promise<BitlyLink[]> {
  const pages: BitlyLink[][] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await bitlyApiCall<{ links?: BitlyLink[]; pagination?: BitlyPagination }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: `/groups/${guid}/bitlinks`,
      query: { size: PAGE_SIZE, archived: 'both', created_after: createdAfter > 0 ? createdAfter : undefined, search_after: cursor },
      operation: 'list Bitlinks',
    });
    pages.push(response.links ?? []);
    cursor = response.pagination?.search_after || undefined;
    if (!cursor) {
      return pages.flat();
    }
  }
  return pages.flat();
}

function nextState({ previous, links }: { previous: PollState | undefined; links: BitlyLink[] }): PollState {
  const newest = links.reduce((max, link) => Math.max(max, createdSeconds(link)), previous?.checkpoint ?? 0);
  const checkpoint = newest;
  const windowStart = checkpoint - OVERLAP_SECONDS;
  const merged: Record<string, number> = {
    ...(previous?.seen ?? {}),
    ...Object.fromEntries(links.map((link) => [link.id, createdSeconds(link)])),
  };
  const seen = Object.fromEntries(Object.entries(merged).filter(([, created]) => created >= windowStart));
  return { checkpoint, seen };
}

function filterLinks({
  links,
  titleFilter,
  tagFilter,
  includeArchived,
}: {
  links: BitlyLink[];
  titleFilter: string | undefined;
  tagFilter: string | undefined;
  includeArchived: boolean;
}): BitlyLink[] {
  const title = titleFilter?.trim().toLowerCase();
  const tag = tagFilter?.trim().toLowerCase();
  return links.filter(
    (link) =>
      (includeArchived || link.archived !== true) &&
      (!title || (link.title ?? '').toLowerCase().includes(title)) &&
      (!tag || (link.tags ?? []).some((t) => t.toLowerCase().includes(tag)))
  );
}

function createdSeconds(link: BitlyLink): number {
  if (!link.created_at) {
    return 0;
  }
  const iso = link.created_at.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
}

function toTriggerItem({ link, detectedAt }: { link: BitlyLink; detectedAt: string }) {
  return {
    id: link.id,
    link: link.link,
    longUrl: link.long_url,
    title: link.title,
    tags: link.tags ?? [],
    isArchived: link.archived,
    createdAt: link.created_at,
    modifiedAt: link.modified_at,
    customBitlinks: link.custom_bitlinks ?? [],
    references: { group: link.references?.group },
    rawLinkData: link,
    triggerInfo: { detectedAt, source: 'bitly', type: 'new_bitlink' },
  };
}

const STATE_KEY = 'bitly-new-bitlink-state';
const LEGACY_STATE_KEY = 'bitly-last-bitlink-ids';
const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const OVERLAP_SECONDS = 120;

type PollState = {
  checkpoint: number;
  seen: Record<string, number>;
};
