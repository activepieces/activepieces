import { createAction, Property } from '@activepieces/pieces-framework';
import { bettermodeAuth } from '../../auth';
import { bindTokenStore, bettermodeQuery } from '../../common/client';
import { bettermodeAiProps } from '../../common/ai-props';
import { EVENT_FIELDS, PAGE_INFO } from '../../common/fields';
import { bettermodeInput } from '../../common/input';
import { bettermodeMap } from '../../common/mappers';
import { bettermodeOps } from '../../common/operations';
import { bettermodeSchemas } from '../../common/schemas';

const EVENT_STATUSES = ['published', 'draft', 'deleted'];
const MODERATION_STATUSES = ['REVIEW', 'ACCEPTED', 'REJECTED', 'PendingConfirmation'];

export const listBadgesAction = createAction({
  auth: bettermodeAuth,
  name: 'list_badges',
  classification: 'SEARCH',
  displayName: 'List Badges',
  description: 'List the badges defined in the community.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every badge of the community with its ID and name. Use to get the Badge ID for Assign Badge to Member or Revoke Badge from Member. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: bettermodeSchemas.badges,
  async run({ auth, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const items = await bettermodeOps.listBadges({ auth: auth.props });
    return { items, count: items.length };
  },
});

export const assignBadgeToMemberAction = createAction({
  auth: bettermodeAuth,
  name: 'assign_badge_to_member',
  classification: 'WRITE',
  displayName: 'Assign Badge to Member',
  description: 'Give a badge to a member by member ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gives an existing badge to a member, both by ID (List Badges, Find Member by Email). Admin only. Safe to retry: assigning a badge the member already holds succeeds again with no change.',
    idempotent: true,
  },
  props: {
    badge_id: bettermodeAiProps.id({ displayName: 'Badge ID', description: 'The badge ID (from List Badges).' }),
    member_id: bettermodeAiProps.id({ displayName: 'Member ID', description: 'The member ID.' }),
  },
  outputSchema: bettermodeSchemas.badgeAction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    return bettermodeOps.changeBadge({
      auth: auth.props,
      operation: 'assignBadge',
      badgeId: bettermodeInput.requireText({ value: propsValue.badge_id, label: 'Badge ID' }),
      memberId: bettermodeInput.requireText({ value: propsValue.member_id, label: 'Member ID' }),
    });
  },
});

export const revokeBadgeFromMemberAction = createAction({
  auth: bettermodeAuth,
  name: 'revoke_badge_from_member',
  classification: 'WRITE',
  displayName: 'Revoke Badge from Member',
  description: 'Take a badge away from a member by member ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a badge from a member, both by ID; it can be assigned again later. Admin only. Safe to retry: revoking a badge the member does not hold succeeds with no change.',
    idempotent: true,
  },
  props: {
    badge_id: bettermodeAiProps.id({ displayName: 'Badge ID', description: 'The badge ID (from List Badges).' }),
    member_id: bettermodeAiProps.id({ displayName: 'Member ID', description: 'The member ID.' }),
  },
  outputSchema: bettermodeSchemas.badgeAction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    return bettermodeOps.changeBadge({
      auth: auth.props,
      operation: 'revokeBadge',
      badgeId: bettermodeInput.requireText({ value: propsValue.badge_id, label: 'Badge ID' }),
      memberId: bettermodeInput.requireText({ value: propsValue.member_id, label: 'Member ID' }),
    });
  },
});

export const listEventsAction = createAction({
  auth: bettermodeAuth,
  name: 'list_events',
  classification: 'SEARCH',
  displayName: 'List Events',
  description: 'List community events.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists events one page at a time, optionally only in some spaces or with a status. Use to find an Event ID for Register for Event. Events need a plan that includes them. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    space_ids: Property.Array({ displayName: 'Space IDs', description: 'Only events in these spaces.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only events with this status.',
      required: false,
      options: {
        options: EVENT_STATUSES.map((status) => ({ label: status, value: status })),
      },
    }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.events,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const status = bettermodeInput.optionalText(propsValue.status);
    if (status !== undefined && !EVENT_STATUSES.includes(status)) {
      throw new Error(`Status must be one of ${EVENT_STATUSES.join(', ')}.`);
    }
    const spaceIds = bettermodeInput.stringList({ value: propsValue.space_ids, label: 'Space IDs' });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query ListEvents($limit: Int!, $after: String, $spaceIds: [ID!], $status: EventStatus) {
  events(limit: $limit, after: $after, spaceIds: $spaceIds, status: $status) {
    nodes {
${EVENT_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
        spaceIds: spaceIds.length > 0 ? spaceIds : undefined,
        status,
      },
    });
    return bettermodeMap.page({ value: data['events'], map: bettermodeMap.event });
  },
});

export const registerForEventAction = createAction({
  auth: bettermodeAuth,
  name: 'register_member_for_event',
  classification: 'WRITE',
  displayName: 'Register for Event',
  description: 'Register the connected member for an event.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Registers the connected member (not another member) for an event by Event ID. Events need a plan that includes them. Not verified as retry-safe: registering twice may error.',
    idempotent: false,
  },
  props: {
    event_id: bettermodeAiProps.id({ displayName: 'Event ID', description: 'The event ID (from List Events).' }),
  },
  outputSchema: bettermodeSchemas.eventRegistration,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const eventId = bettermodeInput.requireText({ value: propsValue.event_id, label: 'Event ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation RegisterForEvent($eventId: ID!) {
  registerForEvent(eventId: $eventId) {
    status
  }
}`,
      variables: { eventId },
      field: 'registerForEvent',
    });
    return { success: true, status, event_id: eventId };
  },
});

export const listModerationItemsAction = createAction({
  auth: bettermodeAuth,
  name: 'list_moderation_items',
  classification: 'SEARCH',
  displayName: 'List Moderation Items',
  description: 'List reported or flagged content waiting for moderation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists moderation queue items (reported or auto-flagged posts and members) one page at a time, optionally by status or space. Admin or moderator only. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only items with this status. REVIEW = waiting for a moderator.',
      required: false,
      options: {
        options: MODERATION_STATUSES.map((status) => ({ label: status, value: status })),
      },
    }),
    space_id: bettermodeAiProps.optionalId({ displayName: 'Space ID', description: 'Only items in this space.' }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.moderationItems,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const status = bettermodeInput.optionalText(propsValue.status);
    if (status !== undefined && !MODERATION_STATUSES.includes(status)) {
      throw new Error(`Status must be one of ${MODERATION_STATUSES.join(', ')}.`);
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query ListModerationItems($limit: Int!, $after: String, $status: ModerationStatus, $spaceId: String) {
  moderationItems(limit: $limit, after: $after, status: $status, spaceId: $spaceId) {
    nodes {
      id
      status
      flaggedBy
      description
      memberId
      spaceId
      createdAt
      updatedAt
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
        status,
        spaceId: bettermodeInput.optionalText(propsValue.space_id),
      },
    });
    return bettermodeMap.page({ value: data['moderationItems'], map: bettermodeMap.moderationItem });
  },
});
