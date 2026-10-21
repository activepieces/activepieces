import { createAction, Property } from '@activepieces/pieces-framework';
import { bettermodeAuth } from '../../auth';
import { bindTokenStore, bettermodeQuery, readPath } from '../../common/client';
import { bettermodeAiProps } from '../../common/ai-props';
import { MEMBER_FIELDS, PAGE_INFO } from '../../common/fields';
import { bettermodeInput } from '../../common/input';
import { bettermodeMap } from '../../common/mappers';
import { bettermodeOps } from '../../common/operations';
import { bettermodeSchemas } from '../../common/schemas';

const MEMBER_STATUSES = ['VERIFIED', 'UNVERIFIED', 'Suspended'];

export const findMemberByEmailAction = createAction({
  auth: bettermodeAuth,
  name: 'find_member_by_email',
  classification: 'SEARCH',
  displayName: 'Find Member by Email',
  description: 'Find the member with an exact email address.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up the one member whose email equals the given address (case-insensitive exact match, never a partial match). Returns found false when nobody matches. Use before badge, space or member actions that need a Member ID. Needs an admin connection to see emails. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'The exact email address.', required: true }),
  },
  outputSchema: bettermodeSchemas.findMember,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const email = bettermodeInput.email({ value: propsValue.email, label: 'Email' });
    const member = await bettermodeOps.findMemberByEmail({ auth: auth.props, email });
    return { found: member !== null, member };
  },
});

export const getMemberAction = createAction({
  auth: bettermodeAuth,
  name: 'get_member',
  classification: 'READ',
  displayName: 'Get Member',
  description: 'Get a member by ID, username or external ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one member by member ID, username or external ID (give exactly one). Use Find Member by Email when you only have an email. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    member_id: bettermodeAiProps.optionalId({ displayName: 'Member ID', description: 'The member ID.' }),
    username: Property.ShortText({ displayName: 'Username', description: 'The member username.', required: false }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'The external ID set by your SSO or integration.',
      required: false,
    }),
  },
  outputSchema: bettermodeSchemas.member,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const id = bettermodeInput.optionalText(propsValue.member_id);
    const username = bettermodeInput.optionalText(propsValue.username);
    const externalId = bettermodeInput.optionalText(propsValue.external_id);
    if ([id, username, externalId].filter((value) => value !== undefined).length !== 1) {
      throw new Error('Give exactly one of Member ID, Username or External ID.');
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query GetMember($id: ID, $username: String, $externalId: String) {
  member(id: $id, username: $username, externalId: $externalId) {
${MEMBER_FIELDS}
  }
}`,
      variables: { id, username, externalId },
    });
    return bettermodeMap.member(data['member']);
  },
});

export const listMembersAction = createAction({
  auth: bettermodeAuth,
  name: 'list_members',
  classification: 'SEARCH',
  displayName: 'List Members',
  description: 'List community members.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists community members one page at a time, optionally by status or a name search (search is fuzzy; use Find Member by Email for an exact email). Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Search', description: 'Fuzzy search on name, username or email.', required: false }),
    status: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Only members with these statuses.',
      required: false,
      options: {
        options: MEMBER_STATUSES.map((status) => ({ label: status, value: status })),
      },
    }),
    limit: bettermodeAiProps.limit(),
    cursor: bettermodeAiProps.cursor(),
  },
  outputSchema: bettermodeSchemas.members,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const statuses = bettermodeInput.stringList({ value: propsValue.status, label: 'Status' });
    const invalid = statuses.filter((status) => !MEMBER_STATUSES.includes(status));
    if (invalid.length > 0) {
      throw new Error(`Status must be one of ${MEMBER_STATUSES.join(', ')}.`);
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query ListMembers($limit: Int!, $after: String, $query: String, $status: [MemberStatusInput!]) {
  members(limit: $limit, after: $after, query: $query, status: $status) {
    nodes {
${MEMBER_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: {
        limit: bettermodeInput.limit({ value: propsValue.limit }),
        after: bettermodeInput.optionalText(propsValue.cursor) ?? null,
        query: bettermodeInput.optionalText(propsValue.query),
        status: statuses.length > 0 ? statuses : undefined,
      },
    });
    return bettermodeMap.page({ value: data['members'], map: bettermodeMap.member });
  },
});

export const updateMemberAction = createAction({
  auth: bettermodeAuth,
  name: 'update_member',
  classification: 'WRITE',
  displayName: 'Update Member',
  description: 'Change the name, tagline or other profile fields of a member.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the profile fields you give (name, username, tagline, external ID, role ID); Clear Tagline blanks the tagline. Leave Member ID empty to update the connected member; other members need an admin connection. Setting the same values again changes nothing.',
    idempotent: true,
  },
  props: {
    member_id: bettermodeAiProps.optionalId({
      displayName: 'Member ID',
      description: 'The member to update. Leave empty for the connected member.',
    }),
    name: Property.ShortText({ displayName: 'Name', description: 'New display name.', required: false }),
    username: Property.ShortText({ displayName: 'Username', description: 'New username.', required: false }),
    tagline: Property.ShortText({ displayName: 'Tagline', description: 'New tagline.', required: false }),
    clear_tagline: Property.Checkbox({ displayName: 'Clear Tagline', description: 'Remove the tagline.', required: false }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'New external ID.', required: false }),
    role_id: bettermodeAiProps.optionalId({
      displayName: 'Role ID',
      description: 'New community role ID (admin only).',
    }),
  },
  outputSchema: bettermodeSchemas.member,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const tagline = bettermodeInput.optionalText(propsValue.tagline);
    const clearTagline = bettermodeInput.optionalBoolean({ value: propsValue.clear_tagline, label: 'Clear Tagline' }) === true;
    if (clearTagline && tagline !== undefined) {
      throw new Error('Give Tagline or Clear Tagline, not both.');
    }
    const input: Record<string, unknown> = {};
    const fields: [string, unknown][] = [
      ['name', propsValue.name],
      ['username', propsValue.username],
      ['externalId', propsValue.external_id],
      ['roleId', propsValue.role_id],
    ];
    for (const [key, value] of fields) {
      const text = bettermodeInput.optionalText(value);
      if (text !== undefined) {
        input[key] = text;
      }
    }
    if (clearTagline) {
      input['tagline'] = '';
    } else if (tagline !== undefined) {
      input['tagline'] = tagline;
    }
    if (Object.keys(input).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `mutation UpdateMember($id: ID, $input: UpdateMemberInput!) {
  updateMember(id: $id, input: $input) {
${MEMBER_FIELDS}
  }
}`,
      variables: { id: bettermodeInput.optionalText(propsValue.member_id), input },
    });
    return bettermodeMap.member(data['updateMember']);
  },
});

export const inviteMembersAction = createAction({
  auth: bettermodeAuth,
  name: 'invite_members',
  classification: 'WRITE',
  displayName: 'Invite Members',
  description: 'Send community invitations by email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends invitation emails to join the community (up to 20 addresses), with an optional message. Real emails go out: only call when the user asked to invite these people. Each call sends new invitations, so retries send duplicates.',
    idempotent: false,
  },
  props: {
    emails: Property.Array({ displayName: 'Emails', description: 'Email addresses to invite (1-20).', required: true }),
    invitation_message: Property.LongText({
      displayName: 'Invitation Message',
      description: 'Optional personal message in the email.',
      required: false,
    }),
    role_id: bettermodeAiProps.optionalId({
      displayName: 'Role ID',
      description: 'Optional community role ID for the invitees.',
    }),
    default_space_ids: Property.Array({
      displayName: 'Default Space IDs',
      description: 'Optional spaces the invitees join.',
      required: false,
    }),
  },
  outputSchema: bettermodeSchemas.invitations,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const emails = bettermodeInput.stringList({ value: propsValue.emails, label: 'Emails' });
    if (emails.length === 0 || emails.length > MAX_INVITES) {
      throw new Error(`Emails must contain between 1 and ${MAX_INVITES} addresses.`);
    }
    emails.forEach((email) => bettermodeInput.email({ value: email, label: 'Each email' }));
    const spaceIds = bettermodeInput.stringList({ value: propsValue.default_space_ids, label: 'Default Space IDs' });
    const input: Record<string, unknown> = {
      invitees: emails.map((email) => ({ email })),
    };
    const message = bettermodeInput.optionalText(propsValue.invitation_message);
    if (message !== undefined) {
      input['invitationMessage'] = message;
    }
    const roleId = bettermodeInput.optionalText(propsValue.role_id);
    if (roleId !== undefined) {
      input['roleId'] = roleId;
    }
    if (spaceIds.length > 0) {
      input['defaultSpacesIds'] = spaceIds;
    }
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `mutation InviteMembers($input: InviteMembersInput!) {
  inviteMembers(input: $input) {
    id
    inviteeEmail
    inviteeName
    status
    expiresAt
    createdAt
  }
}`,
      variables: { input },
    });
    const items = bettermodeMap.records(data['inviteMembers']).map(bettermodeMap.invitation);
    return { items, count: items.length };
  },
});

export const suspendMemberAction = createAction({
  auth: bettermodeAuth,
  name: 'suspend_member',
  classification: 'DESTRUCTIVE',
  displayName: 'Suspend Member',
  description: 'Suspend a member so they can no longer log in.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Suspends a member: they are logged out and cannot sign in or post until unsuspended. Admin only. Only call when the user explicitly asked to suspend this exact member.',
    idempotent: false,
  },
  props: {
    member_id: bettermodeAiProps.id({ displayName: 'Member ID', description: 'The member ID.' }),
  },
  outputSchema: bettermodeSchemas.memberAction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const memberId = bettermodeInput.requireText({ value: propsValue.member_id, label: 'Member ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation SuspendMember($memberId: String!) {
  suspendMember(memberId: $memberId) {
    status
  }
}`,
      variables: { memberId },
      field: 'suspendMember',
    });
    return { success: true, status, member_id: memberId };
  },
});

export const unsuspendMemberAction = createAction({
  auth: bettermodeAuth,
  name: 'unsuspend_member',
  classification: 'WRITE',
  displayName: 'Unsuspend Member',
  description: 'Restore access for a suspended member.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lifts a suspension so the member can sign in again. Admin only.',
    idempotent: false,
  },
  props: {
    member_id: bettermodeAiProps.id({ displayName: 'Member ID', description: 'The member ID.' }),
  },
  outputSchema: bettermodeSchemas.memberAction,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const memberId = bettermodeInput.requireText({ value: propsValue.member_id, label: 'Member ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation UnsuspendMember($memberId: String!) {
  unsuspendMember(memberId: $memberId) {
    status
  }
}`,
      variables: { memberId },
      field: 'unsuspendMember',
    });
    return { success: true, status, member_id: memberId };
  },
});

export const deleteMemberAction = createAction({
  auth: bettermodeAuth,
  name: 'delete_member',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Member',
  description: 'Permanently delete a member from the community.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a member account from the community; this cannot be undone. Admin only. Only call when the user explicitly asked to delete this exact member; prefer Suspend Member when unsure.',
    idempotent: false,
  },
  props: {
    member_id: bettermodeAiProps.id({ displayName: 'Member ID', description: 'The member to delete.' }),
  },
  outputSchema: bettermodeSchemas.deleted,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const memberId = bettermodeInput.requireText({ value: propsValue.member_id, label: 'Member ID' });
    const status = await bettermodeOps.runActionMutation({
      auth: auth.props,
      query: `mutation DeleteMember($id: ID!) {
  deleteMember(id: $id) {
    status
  }
}`,
      variables: { id: memberId },
      field: 'deleteMember',
    });
    return { id: memberId, deleted: true, status };
  },
});

export const sendDirectMessageAction = createAction({
  auth: bettermodeAuth,
  name: 'send_direct_message',
  classification: 'WRITE',
  displayName: 'Send Direct Message',
  description: 'Send a chat message to a member.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends a private chat message from the connected member to another member. Needs chat enabled on the community plan. Each call sends a new message, so retries send duplicates.',
    idempotent: false,
  },
  props: {
    recipient_id: bettermodeAiProps.id({ displayName: 'Recipient Member ID', description: 'The member to message.' }),
    content: Property.LongText({ displayName: 'Message', description: 'The message text.', required: true }),
  },
  outputSchema: bettermodeSchemas.message,
  async run({ auth, propsValue, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const recipientId = bettermodeInput.requireText({ value: propsValue.recipient_id, label: 'Recipient Member ID' });
    const content = bettermodeInput.requireText({ value: propsValue.content, label: 'Message' });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `mutation SendMessage($input: SendMessageToMemberInput!) {
  sendMessageToMember(input: $input) {
    chatId
    message {
      _id
      content
      sentAt
    }
  }
}`,
      variables: { input: { recipientId, message: { content } } },
    });
    const sent = data['sendMessageToMember'];
    return {
      message_id: bettermodeMap.text(readPath({ value: sent, path: ['message', '_id'] })),
      chat_id: bettermodeMap.text(readPath({ value: sent, path: ['chatId'] })),
      recipient_id: recipientId,
      content: bettermodeMap.text(readPath({ value: sent, path: ['message', 'content'] })),
      sent_at: bettermodeMap.text(readPath({ value: sent, path: ['message', 'sentAt'] })),
    };
  },
});


const MAX_INVITES = 20;
