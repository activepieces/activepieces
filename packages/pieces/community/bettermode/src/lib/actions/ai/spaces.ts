import { createAction, Property } from '@activepieces/pieces-framework';
import { bettermodeAuth } from '../../auth';
import { bindTokenStore, bettermodeQuery } from '../../common/client';
import { bettermodeAiProps } from '../../common/ai-props';
import { MEMBER_FIELDS, PAGE_INFO, SPACE_FIELDS } from '../../common/fields';
import { bettermodeInput } from '../../common/input';
import { bettermodeMap } from '../../common/mappers';
import { bettermodeOps } from '../../common/operations';
import { bettermodeSchemas } from '../../common/schemas';

export const listSpacesAction = createAction({
  auth: bettermodeAuth,
  name: 'list_spaces',
  classification: 'SEARCH',
  displayName: 'List Spaces',
  description: 'List spaces in the community, optionally filtered by name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists community spaces (ID, name, slug, privacy, counts), one page at a time; filter by name with Search. Use to find the Space ID needed by Create Post, List Posts or space membership actions. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search',
      description: 'Only return spaces whose name matches this text.',
      required: false,
    }),
    member_id: bettermodeAiProps.optionalId({
      displayName: 'Member ID',
      description: 'Only return spaces this member has joined.',
    }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.spaces,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    return bettermodeOps.listSpacesPage({
      auth: auth.props,
      limit: bettermodeInput.limit({ value: propsValue.limit }),
      after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
      query: bettermodeInput.optionalText(propsValue.query),
      memberId: bettermodeInput.optionalText(propsValue.member_id),
    });
  },
});

export const getSpaceAction = createAction({
  auth: bettermodeAuth,
  name: 'get_space',
  classification: 'READ',
  displayName: 'Get Space',
  description: 'Get a space by ID or slug.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one space by its ID or by its URL slug (give exactly one). Use when you have a space link or ID and need its details. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    space_id: bettermodeAiProps.optionalId({ displayName: 'Space ID', description: 'The space ID. Give this or the slug.' }),
    slug: Property.ShortText({
      displayName: 'Space Slug',
      description: 'The slug from the space URL. Give this or the ID.',
      required: false,
    }),
  },
  outputSchema: bettermodeSchemas.space,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const id = bettermodeInput.optionalText(propsValue.space_id);
    const slug = bettermodeInput.optionalText(propsValue.slug);
    if ((id === undefined) === (slug === undefined)) {
      throw new Error('Give exactly one of Space ID or Space Slug.');
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query GetSpace($id: ID, $slug: ID) {
  space(id: $id, slug: $slug) {
${SPACE_FIELDS}
  }
}`,
      variables: { id, slug },
    });
    return bettermodeMap.space(data['space']);
  },
});

export const listSpaceMembersAction = createAction({
  auth: bettermodeAuth,
  name: 'list_space_members',
  classification: 'SEARCH',
  displayName: 'List Space Members',
  description: 'List the members of a space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists members of one space with their space role, one page at a time. Use to check who belongs to a space before adding or removing members. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    space_id: bettermodeAiProps.id({ displayName: 'Space ID', description: 'The space ID (from List Spaces).' }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.spaceMembers,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query ListSpaceMembers($spaceId: ID!, $limit: Int!, $after: String) {
  spaceMembers(spaceId: $spaceId, limit: $limit, after: $after) {
    nodes {
      member {
${MEMBER_FIELDS}
      }
      role { id name }
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        spaceId: bettermodeInput.requireText({ value: propsValue.space_id, label: 'Space ID' }),
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
      },
    });
    return bettermodeMap.page({ value: data['spaceMembers'], map: bettermodeMap.spaceMember });
  },
});

export const addMemberToSpaceAction = createAction({
  auth: bettermodeAuth,
  name: 'add_member_to_space',
  classification: 'WRITE',
  displayName: 'Add Members to Space',
  description: 'Add one or more members to a space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds members (by member ID) to a space, optionally with a space role ID. Use after Find Member by Email when you only have an email. Needs space or community admin rights. Safe to retry: re-adding a member already in the space succeeds and leaves them out of the returned items.',
    idempotent: true,
  },
  props: {
    space_id: bettermodeAiProps.id({ displayName: 'Space ID', description: 'The space ID (from List Spaces).' }),
    member_ids: Property.Array({
      displayName: 'Member IDs',
      description: 'Member IDs to add (1-50).',
      required: true,
    }),
    role_id: bettermodeAiProps.optionalId({
      displayName: 'Space Role ID',
      description: 'Optional space role ID. Leave empty for the default member role.',
    }),
  },
  outputSchema: bettermodeSchemas.spaceMembership,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const spaceId = bettermodeInput.requireText({ value: propsValue.space_id, label: 'Space ID' });
    const memberIds = requireMemberIds(propsValue.member_ids);
    const roleId = bettermodeInput.optionalText(propsValue.role_id);
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `mutation AddSpaceMembers($spaceId: ID!, $input: [AddSpaceMemberInput!]!) {
  addSpaceMembers(spaceId: $spaceId, input: $input) {
    member { id name email username }
    role { id name }
  }
}`,
      variables: {
        spaceId,
        input: memberIds.map((memberId) => (roleId === undefined ? { memberId } : { memberId, roleId })),
      },
    });
    return {
      space_id: spaceId,
      member_ids: memberIds.join(', '),
      items: bettermodeMap.records(data['addSpaceMembers']).map(bettermodeMap.spaceMember),
    };
  },
});

export const removeMemberFromSpaceAction = createAction({
  auth: bettermodeAuth,
  name: 'remove_member_from_space',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Members from Space',
  description: 'Remove one or more members from a space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes members (by member ID) from a space; they lose access to a private space until re-added. Only call when the user asked to remove these exact members. Needs space or community admin rights.',
    idempotent: false,
  },
  props: {
    space_id: bettermodeAiProps.id({ displayName: 'Space ID', description: 'The space ID (from List Spaces).' }),
    member_ids: Property.Array({
      displayName: 'Member IDs',
      description: 'Member IDs to remove (1-50).',
      required: true,
    }),
  },
  outputSchema: bettermodeSchemas.removeFromSpace,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const spaceId = bettermodeInput.requireText({ value: propsValue.space_id, label: 'Space ID' });
    const memberIds = requireMemberIds(propsValue.member_ids);
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `mutation RemoveSpaceMembers($spaceId: ID!, $memberIds: [ID!]!) {
  removeSpaceMembers(spaceId: $spaceId, memberIds: $memberIds) {
    status
  }
}`,
      variables: { spaceId, memberIds },
    });
    const statuses = bettermodeMap.records(data['removeSpaceMembers']).map((item) => bettermodeMap.actionStatus(item));
    const failed = statuses.length === 0 || statuses.some((status) => status !== 'succeeded');
    if (failed) {
      throw new Error(
        `Bettermode did not remove every member from the space (statuses: ${statuses.join(', ') || 'none'}). Removing a member who is not in the space fails.`
      );
    }
    return { success: true, status: 'succeeded', space_id: spaceId, member_ids: memberIds.join(', ') };
  },
});

function requireMemberIds(value: unknown): string[] {
  const memberIds = bettermodeInput.stringList({ value, label: 'Member IDs' });
  if (memberIds.length === 0) {
    throw new Error('Member IDs must contain at least one member ID.');
  }
  if (memberIds.length > MAX_MEMBER_IDS) {
    throw new Error(`Give at most ${MAX_MEMBER_IDS} member IDs per call.`);
  }
  return memberIds;
}

const MAX_MEMBER_IDS = 50;
