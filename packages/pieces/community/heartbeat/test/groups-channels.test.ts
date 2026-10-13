import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { listRolesAction } from '../src/lib/actions/list-roles';
import { listGroupsAction } from '../src/lib/actions/list-groups';
import { getGroupAction } from '../src/lib/actions/get-group';
import { createGroupAction } from '../src/lib/actions/create-group';
import { updateGroupAction } from '../src/lib/actions/update-group';
import { deleteGroupAction } from '../src/lib/actions/delete-group';
import { addUsersToGroupAction } from '../src/lib/actions/add-users-to-group';
import { removeUsersFromGroupAction } from '../src/lib/actions/remove-users-from-group';
import { listChannelsAction } from '../src/lib/actions/list-channels';
import { listChannelCategoriesAction } from '../src/lib/actions/list-channel-categories';
import { createChannelCategoryAction } from '../src/lib/actions/create-channel-category';
import { createChannelAction } from '../src/lib/actions/create-channel';
import { updateChannelAction } from '../src/lib/actions/update-channel';
import { deleteChannelAction } from '../src/lib/actions/delete-channel';
import { IDS, replies, run, stubFetch } from './helpers';

const group = { id: IDS.group, name: 'AP-TEST group', archived: false, parentGroupID: null, users: [{ id: IDS.user, name: 'A', email: 'odai+aptest-1@activepieces.com' }] };
const channels = [
	{ id: IDS.channel, name: 'AP-TEST posts', emoji: 'x', type: 'POSTS' },
	{ id: IDS.thread, name: 'AP-TEST chat', emoji: 'y', type: 'CHAT' },
];

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('roles and groups', () => {
	test('list roles wraps the array', async () => {
		stubFetch(replies([{ body: [{ id: IDS.role, name: 'User' }] }]));
		expect(await run({ action: listRolesAction, propsValue: {} })).toEqual({ roles: [{ id: IDS.role, name: 'User' }], count: 1 });
	});
	test('list groups hides archived and members by default', async () => {
		stubFetch(replies([{ body: [group, { ...group, id: 'g2', archived: true }] }]));
		expect(await run({ action: listGroupsAction, propsValue: {} })).toEqual({ groups: [{ id: IDS.group, name: 'AP-TEST group', archived: false, parentGroupID: null }], count: 1 });
	});
	test('list groups can include archived and members', async () => {
		stubFetch(replies([{ body: [group, { ...group, id: 'g2', archived: true }] }]));
		expect(await run({ action: listGroupsAction, propsValue: { includeArchived: true, includeMembers: true } })).toMatchObject({ count: 2, groups: [{ users: group.users }, {}] });
	});
	test('get group reads /groups/{id}', async () => {
		const seen = stubFetch(replies([{ body: group }]));
		expect(await run({ action: getGroupAction, propsValue: { groupId: IDS.group } })).toEqual(group);
		expect(seen[0].path).toBe(`/groups/${IDS.group}`);
	});
	test('create group PUTs and re-reads by the returned groupID', async () => {
		const seen = stubFetch(replies([{ body: { success: true, groupID: IDS.group } }, { body: group }]));
		expect(await run({ action: createGroupAction, propsValue: { name: 'AP-TEST group', memberEmails: ['odai+aptest-1@activepieces.com'], parentGroupId: IDS.admin } })).toEqual({ ...group, lookupError: null });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].body).toEqual({ name: 'AP-TEST group', members: ['odai+aptest-1@activepieces.com'], parentGroupID: IDS.admin });
	});
	test('create group keeps the new ID when the read-back fails', async () => {
		stubFetch(replies([{ body: { success: true, groupID: IDS.group } }, { status: 500, body: { message: 'down' } }]));
		const result = await run({ action: createGroupAction, propsValue: { name: 'AP-TEST group' } });
		expect(result).toMatchObject({ id: IDS.group, name: 'AP-TEST group', lookupError: expect.stringMatching(/Do not re-run/) });
	});
	test('create group fails loudly without an ID', async () => {
		stubFetch(replies([{ body: { success: true } }]));
		await expect(run({ action: createGroupAction, propsValue: { name: 'X' } })).rejects.toThrow(/did not return its ID/);
	});
	test('update group sends only set fields and refuses no-op', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }, { body: group }]));
		expect(await run({ action: updateGroupAction, propsValue: { groupId: IDS.group, name: 'New', isIsolated: 'unchanged', isJoinable: 'no' } })).toMatchObject({ updated: true, updatedFields: ['name', 'isJoinable'] });
		expect(seen[0].method).toBe('POST');
		expect(seen[0].body).toEqual({ name: 'New', isJoinable: false });
		await expect(run({ action: updateGroupAction, propsValue: { groupId: IDS.group, isIsolated: 'unchanged' } })).rejects.toThrow(/Nothing to update/);
	});
	test('delete group maps 404 to alreadyDeleted and rethrows 400 with reason', async () => {
		stubFetch(replies([{ status: 404, body: { error: true, message: 'Could not find group' } }]));
		expect(await run({ action: deleteGroupAction, propsValue: { groupId: IDS.group } })).toEqual({ id: IDS.group, deleted: true, alreadyDeleted: true });
		vi.unstubAllGlobals();
		stubFetch(replies([{ status: 400, body: { message: 'Group has child groups' } }]));
		await expect(run({ action: deleteGroupAction, propsValue: { groupId: IDS.group } })).rejects.toThrow(/Group has child groups/);
	});
	test('delete group success', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }]));
		expect(await run({ action: deleteGroupAction, propsValue: { groupId: IDS.group } })).toEqual({ id: IDS.group, deleted: true, alreadyDeleted: false });
		expect(seen[0].method).toBe('DELETE');
	});
	test('add members lists emails as unverified when the group read-back fails', async () => {
		stubFetch(replies([{ status: 204, text: '' }, { status: 500, body: { message: 'down' } }]));
		const result = await run({ action: addUsersToGroupAction, propsValue: { groupId: IDS.group, emails: ['a@x.io'] } });
		expect(result).toMatchObject({ added: [], notAdded: [], unverified: ['a@x.io'], lookupError: expect.stringMatching(/saved in Heartbeat/) });
	});
	test('update group stays successful when the read-back fails', async () => {
		stubFetch(replies([{ status: 204, text: '' }, { status: 500, body: { message: 'down' } }]));
		const result = await run({ action: updateGroupAction, propsValue: { groupId: IDS.group, name: 'New' } });
		expect(result).toMatchObject({ id: IDS.group, updated: true, group: null, lookupError: expect.stringMatching(/saved in Heartbeat/) });
	});
	test('add members PUTs memberships and reports ignored emails', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }, { body: group }]));
		const result = await run({ action: addUsersToGroupAction, propsValue: { groupId: IDS.group, emails: ['ODAI+aptest-1@activepieces.com', 'nobody@x.io'], removeFromSiblingGroups: true } });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].path).toBe(`/groups/${IDS.group}/memberships`);
		expect(seen[0].body).toEqual({ emails: ['ODAI+aptest-1@activepieces.com', 'nobody@x.io'], shouldRemoveFromSiblingGroups: true });
		expect(result).toMatchObject({ added: ['ODAI+aptest-1@activepieces.com'], notAdded: ['nobody@x.io'] });
	});
	test('remove members sends DELETE memberships', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }]));
		expect(await run({ action: removeUsersFromGroupAction, propsValue: { groupId: IDS.group, emails: ['a@x.io'] } })).toEqual({ groupId: IDS.group, emails: ['a@x.io'], removed: true });
		expect(seen[0].method).toBe('DELETE');
		expect(seen[0].body).toEqual({ emails: ['a@x.io'] });
	});
	test('membership actions refuse empty email lists', async () => {
		stubFetch(replies([{ body: {} }]));
		await expect(run({ action: removeUsersFromGroupAction, propsValue: { groupId: IDS.group, emails: [] } })).rejects.toThrow(/at least one/);
	});
});

describe('channels', () => {
	test('list channels filters by type', async () => {
		stubFetch(replies([{ body: channels }]));
		expect(await run({ action: listChannelsAction, propsValue: { type: 'CHAT' } })).toEqual({ channels: [channels[1]], count: 1 });
	});
	test('list channels rejects an unknown type', async () => {
		stubFetch(replies([{ body: channels }]));
		await expect(run({ action: listChannelsAction, propsValue: { type: 'VIDEO' } })).rejects.toThrow(/Type must be/);
	});
	test('list categories', async () => {
		stubFetch(replies([{ body: [{ id: IDS.category, name: 'Everyone' }] }]));
		expect(await run({ action: listChannelCategoriesAction, propsValue: {} })).toEqual({ categories: [{ id: IDS.category, name: 'Everyone' }], count: 1 });
	});
	test('create category PUTs name', async () => {
		const seen = stubFetch(replies([{ body: { id: IDS.category, name: 'C' } }]));
		expect(await run({ action: createChannelCategoryAction, propsValue: { name: 'C' } })).toEqual({ id: IDS.category, name: 'C' });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].body).toEqual({ name: 'C' });
	});
	test('create channel maps visibility and re-reads the channel', async () => {
		const seen = stubFetch(replies([{ body: { success: true, channelID: IDS.channel } }, { body: channels }]));
		const result = await run({ action: createChannelAction, propsValue: { name: 'AP-TEST posts', channelCategoryId: IDS.category, channelType: 'POSTS', visibility: 'private', invitedEmails: ['a@x.io'], isReadOnly: true } });
		expect(seen[0].body).toEqual({ name: 'AP-TEST posts', isPrivate: true, channelCategoryID: IDS.category, channelType: 'POSTS', invitedUsers: ['a@x.io'], isReadOnly: true });
		expect(result).toEqual({ ...channels[0], lookupError: null });
	});
	test('create channel keeps the new ID when the read-back fails', async () => {
		stubFetch(replies([{ body: { success: true, channelID: IDS.channel } }, { status: 500, body: { message: 'down' } }]));
		const result = await run({ action: createChannelAction, propsValue: { name: 'AP-TEST posts', channelCategoryId: IDS.category, channelType: 'POSTS', visibility: 'public' } });
		expect(result).toMatchObject({ id: IDS.channel, name: 'AP-TEST posts', type: 'POSTS', lookupError: expect.stringMatching(/saved in Heartbeat/) });
	});
	test('create channel requires an explicit visibility and refuses read-only chat', async () => {
		stubFetch(replies([{ body: {} }]));
		await expect(run({ action: createChannelAction, propsValue: { name: 'x', channelCategoryId: IDS.category, channelType: 'POSTS' } })).rejects.toThrow(/Visibility/);
		await expect(run({ action: createChannelAction, propsValue: { name: 'x', channelCategoryId: IDS.category, channelType: 'CHAT', visibility: 'public', isReadOnly: true } })).rejects.toThrow(/chat channels/);
	});
	test('update channel: public sends restrictedTo null', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }, { body: channels }]));
		await run({ action: updateChannelAction, propsValue: { channelId: IDS.channel, access: 'public' } });
		expect(seen[0].method).toBe('POST');
		expect(seen[0].path).toBe(`/channels/${IDS.channel}`);
		expect(seen[0].body).toEqual({ restrictedTo: null });
	});
	test('update channel: restricted sends lists, unchanged omits restrictedTo', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }, { body: channels }]));
		await run({ action: updateChannelAction, propsValue: { channelId: IDS.channel, access: 'restricted', invitedGroupIds: [IDS.group] } });
		expect(seen[0].body).toEqual({ restrictedTo: { invitedUsers: [], invitedGroups: [IDS.group] } });
		await run({ action: updateChannelAction, propsValue: { channelId: IDS.channel, name: 'N' } });
		expect(seen[2].body).toEqual({ name: 'N' });
	});
	test('update channel validation', async () => {
		stubFetch(replies([{ body: {} }]));
		await expect(run({ action: updateChannelAction, propsValue: { channelId: IDS.channel } })).rejects.toThrow(/Nothing to update/);
		await expect(run({ action: updateChannelAction, propsValue: { channelId: IDS.channel, access: 'restricted' } })).rejects.toThrow(/at least one/);
		await expect(run({ action: updateChannelAction, propsValue: { channelId: IDS.channel, invitedEmails: ['a@x.io'] } })).rejects.toThrow(/only used when Access is Restricted/);
	});
	test('delete channel maps 404 to alreadyDeleted', async () => {
		stubFetch(replies([{ status: 404, body: { code: 'NOT_FOUND_ERROR', message: 'Could not find channel' } }]));
		expect(await run({ action: deleteChannelAction, propsValue: { channelId: IDS.channel } })).toEqual({ id: IDS.channel, deleted: true, alreadyDeleted: true });
	});
	test('delete channel success', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }]));
		expect(await run({ action: deleteChannelAction, propsValue: { channelId: IDS.channel } })).toMatchObject({ alreadyDeleted: false });
		expect(seen[0].method).toBe('DELETE');
	});
});
