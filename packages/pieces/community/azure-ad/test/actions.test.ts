import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { azureAd } from '../src';
import { createUserAction } from '../src/lib/actions/create-user';
import { findUsersAction, buildFindUsersFilter } from '../src/lib/actions/find-users';
import { listGroupsAction } from '../src/lib/actions/list-groups';
import { listUserGroupsAction } from '../src/lib/actions/list-user-groups';
import { removeMemberFromGroupAction } from '../src/lib/actions/remove-member-from-group';
import { updateGroupAction } from '../src/lib/actions/update-group';
import { setUserAccountEnabledAction } from '../src/lib/actions/set-user-account-enabled';
import { setUserManagerAction } from '../src/lib/actions/set-user-manager';
import { listSubscribedSkusAction } from '../src/lib/actions/list-subscribed-skus';
import { resetCustomAttributesAction } from '../src/lib/actions/reset-custom-attributes';
import { getGroupCustomAttributesAction } from '../src/lib/actions/get-group-custom-attributes';
import { listEnabledUsersAction } from '../src/lib/actions/list-enabled-users';
import { listGroupMembersAction } from '../src/lib/actions/list-group-members';
import { deleteUserAction } from '../src/lib/actions/delete-user';
import { addOrRemoveUserLicenseAction, buildAssignLicenseBody, skuLabel } from '../src/lib/actions/add-or-remove-user-license';
import { createUserAction as createUserForUi } from '../src/lib/actions/create-user';
import { createGroupAction } from '../src/lib/actions/create-group';
import { getUserByIdAction } from '../src/lib/actions/get-user-by-id';
import { updateUserAction } from '../src/lib/actions/update-user';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

const AUTH = { access_token: 'tok', type: 'OAUTH2', props: {} };
const G = 'https://graph.microsoft.com/v1.0';
const EXT = 'extension_0123456789abcdef0123456789abcdef_costCenter';

function respond({ body, status = 200 }: { body: unknown; status?: number }) {
    sendRequest.mockResolvedValueOnce({ status, headers: {}, body });
}

function run({ action, props }: { action: { run: (ctx: never) => Promise<unknown> }; props: Record<string, unknown> }): Promise<unknown> {
    const ctx = { ...createMockActionContext({ propsValue: props }), auth: AUTH };
    return Reflect.apply(action.run, action, [ctx]);
}

function call({ index }: { index: number }) {
    const req = sendRequest.mock.calls[index][0];
    return { method: req.method, url: decodeURIComponent(req.url), body: req.body, headers: req.headers };
}

beforeEach(() => sendRequest.mockReset());

describe('piece metadata', () => {
    it('targets 0.88.2 and every action except Custom API Call has an outputSchema', () => {
        expect(azureAd.minimumSupportedRelease).toBe('0.88.2');
        const missing = Object.values(azureAd.actions()).filter((a) => a.name !== 'custom_api_call' && a.outputSchema === undefined).map((a) => a.name);
        expect(missing).toEqual([]);
        expect(Object.values(azureAd.triggers()).every((t) => t.outputSchema !== undefined)).toBe(true);
    });

    it('sets the agreed audiences', () => {
        const audience = Object.fromEntries(Object.values(azureAd.actions()).map((a) => [a.name, a.audience]));
        expect(audience['list_users']).toBe('human');
        expect(audience['get_enabled_users']).toBe('human');
        expect(audience['list_enabled_users']).toBe('human');
        expect(audience['find_users']).toBe('ai');
        for (const name of ['remove_member_from_group', 'update_group', 'set_user_account_enabled', 'list_groups', 'list_user_groups', 'list_subscribed_skus', 'set_user_manager']) {
            expect(audience[name]).toBe('both');
        }
    });

    it('aiMetadata only names tools that exist', () => {
        const actions = Object.values(azureAd.actions());
        const names = new Set(actions.map((a) => a.displayName));
        const referenced = ['List Users', 'Get Enabled Users', 'Update User (accountEnabled)'];
        for (const a of actions) {
            if (a.audience === 'human') continue;
            for (const r of referenced) {
                expect(a.aiMetadata?.description ?? '').not.toContain(r);
            }
        }
        for (const n of ['Find Users', 'Enable or Disable User', 'Remove Member from Group', 'List User Groups', 'Add or Remove User License', 'Revoke Sign-in Session', 'List Group Members']) {
            expect(names.has(n)).toBe(true);
        }
    });
});

describe('create_user', () => {
    it('fails with the Graph message and never the password', async () => {
        sendRequest.mockRejectedValueOnce(new HttpError({ passwordProfile: { password: 'Pa55word!' } }, {
            status: 400,
            responseBody: { error: { code: 'Request_BadRequest', message: 'Another object with the same value for property userPrincipalName already exists.' } },
        }));
        const err = await run({ action: createUserAction, props: { displayName: 'A', userPrincipalName: 'a@x.com', mailNickname: 'a', password: 'Pa55word!' } }).catch((e: unknown) => e);
        const message = err instanceof Error ? err.message : '';
        expect(message).toContain('(400): Request_BadRequest: Another object with the same value');
        expect(message).not.toContain('Pa55word!');
        expect(sendRequest.mock.calls[0][0].redactBodyInErrors).toBe(true);
    });
});

describe('find_users', () => {
    it('builds an exact email + name + enabled filter with advanced query headers', async () => {
        respond({ body: { value: [{ id: 'u1' }], '@odata.nextLink': `${G}/users?$skiptoken=n` } });
        const out = await run({ action: findUsersAction, props: { email: "o'b@x.com", name: 'Ada', enabled: 'no', limit: 500 } });
        const c = call({ index: 0 });
        expect(c.method).toBe('GET');
        expect(c.url).toBe(`${G}/users?$select=id,displayName,userPrincipalName,mail,givenName,surname,jobTitle,department,accountEnabled,createdDateTime&$top=100&$filter=(mail eq 'o''b@x.com' or userPrincipalName eq 'o''b@x.com' or otherMails/any(m:m eq 'o''b@x.com')) and (startswith(displayName,'Ada') or startswith(givenName,'Ada') or startswith(surname,'Ada')) and accountEnabled eq false&$count=true`);
        expect(c.headers.ConsistencyLevel).toBe('eventual');
        expect(out).toEqual({ items: [{ id: 'u1' }], next_cursor: `${G}/users?$skiptoken=n`, has_more: true });
    });

    it('follows the cursor and refuses a foreign one', async () => {
        respond({ body: { value: [] } });
        await run({ action: findUsersAction, props: { cursor: `${G}/users?$skiptoken=n` } });
        expect(call({ index: 0 }).url).toBe(`${G}/users?$skiptoken=n`);
        await expect(run({ action: findUsersAction, props: { cursor: 'https://evil.io/v1.0/users' } })).rejects.toThrow(/must point to/);
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown enabled value and lists everyone with no filters', () => {
        expect(() => buildFindUsersFilter({ enabled: 'true' })).toThrow(/any/);
        expect(buildFindUsersFilter({})).toBeUndefined();
    });
});

describe('list_groups / list_user_groups', () => {
    it('list_groups filters by name prefix', async () => {
        respond({ body: { value: [{ id: 'g1' }] } });
        await run({ action: listGroupsAction, props: { name: 'Fin' } });
        expect(call({ index: 0 }).url).toContain(`${G}/groups?$select=`);
        expect(call({ index: 0 }).url).toContain("$filter=startswith(displayName,'Fin') or startswith(mail,'Fin')&$count=true");
    });

    it('list_user_groups reads memberOf cast to groups', async () => {
        respond({ body: { value: [] } });
        const out = await run({ action: listUserGroupsAction, props: { userId: 'ada@x.com', limit: 10 } });
        expect(call({ index: 0 }).url).toMatch(new RegExp(`^${G}/users/ada@x.com/memberOf/microsoft.graph.group\\?\\$select=.*&\\$top=10$`));
        expect(out).toEqual({ items: [], next_cursor: null, has_more: false });
    });
});

describe('membership and user writes', () => {
    it('remove_member_from_group sends DELETE .../members/{id}/$ref', async () => {
        respond({ body: undefined, status: 204 });
        const out = await run({ action: removeMemberFromGroupAction, props: { groupId: 'g1', memberId: 'u1' } });
        expect(call({ index: 0 })).toMatchObject({ method: 'DELETE', url: `${G}/groups/g1/members/u1/$ref`, body: undefined });
        expect(out).toEqual({ success: true, group_id: 'g1', member_id: 'u1' });
    });

    it('update_group PATCHes only given fields, clears description on request, reads back', async () => {
        respond({ body: undefined, status: 204 });
        respond({ body: { id: 'g1', displayName: 'New' } });
        const out = await run({ action: updateGroupAction, props: { groupId: 'g1', displayName: ' New ', clearDescription: true, visibility: 'Private' } });
        expect(call({ index: 0 })).toMatchObject({ method: 'PATCH', url: `${G}/groups/g1`, body: { displayName: 'New', description: null, visibility: 'Private' } });
        expect(call({ index: 1 }).method).toBe('GET');
        expect(out).toEqual({ id: 'g1', displayName: 'New' });
    });

    it('update_group refuses an empty update', async () => {
        await expect(run({ action: updateGroupAction, props: { groupId: 'g1' } })).rejects.toThrow(/at least one/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('set_user_account_enabled PATCHes accountEnabled', async () => {
        respond({ body: undefined, status: 204 });
        respond({ body: { id: 'u1', accountEnabled: false } });
        await run({ action: setUserAccountEnabledAction, props: { userId: 'u1', state: 'disable' } });
        expect(call({ index: 0 })).toMatchObject({ method: 'PATCH', url: `${G}/users/u1`, body: { accountEnabled: false } });
        expect(call({ index: 1 }).url).toBe(`${G}/users/u1?$select=id,displayName,userPrincipalName,accountEnabled`);
    });

    it('set_user_manager PUTs an @odata.id reference and refuses self-management', async () => {
        respond({ body: undefined, status: 204 });
        await run({ action: setUserManagerAction, props: { userId: 'u1', managerId: 'm1' } });
        expect(call({ index: 0 })).toMatchObject({ method: 'PUT', url: `${G}/users/u1/manager/$ref`, body: { '@odata.id': `${G}/users/m1` } });
        await expect(run({ action: setUserManagerAction, props: { userId: 'u1', managerId: 'U1' } })).rejects.toThrow(/own manager/);
    });

    it('delete_user returns the id', async () => {
        respond({ body: undefined, status: 204 });
        expect(await run({ action: deleteUserAction, props: { userId: 'u1' } })).toEqual({ success: true, message: 'User deleted.', id: 'u1' });
        expect(call({ index: 0 })).toMatchObject({ method: 'DELETE', url: `${G}/users/u1` });
    });
});

describe('add_or_remove_user_license', () => {
    const graphUser = { '@odata.context': `${G}/$metadata#users/$entity`, id: 'u1', displayName: 'Ada', userPrincipalName: 'ada@x.com', businessPhones: [] };
    const conflict = () => new HttpError(undefined, { status: 409, responseBody: { error: { code: 'Directory_ConcurrencyViolation', message: 'Another update is in progress' } } });

    it('is idempotent, posts assignLicense, strips @odata keys and fills declared keys with null', async () => {
        respond({ body: graphUser });
        const out = await run({ action: addOrRemoveUserLicenseAction, props: { userId: 'u1', addLicenses: [{ skuId: 's1' }], removeLicenses: ['s2'] } });
        expect(addOrRemoveUserLicenseAction.aiMetadata?.idempotent).toBe(true);
        expect(call({ index: 0 })).toMatchObject({ method: 'POST', url: `${G}/users/u1/assignLicense`, body: { addLicenses: [{ skuId: 's1' }], removeLicenses: ['s2'] } });
        expect(out).not.toHaveProperty('@odata.context');
        expect(out).toMatchObject({ id: 'u1', mail: null, officeLocation: null, preferredLanguage: null, jobTitle: null, accountEnabled: null });
    });

    it('retries a 409 Directory_ConcurrencyViolation with backoff', async () => {
        vi.useFakeTimers();
        try {
            sendRequest.mockRejectedValueOnce(conflict());
            sendRequest.mockRejectedValueOnce(conflict());
            respond({ body: graphUser });
            const pending = run({ action: addOrRemoveUserLicenseAction, props: { userId: 'u1', addLicenses: [{ skuId: 's1' }] } });
            await vi.advanceTimersByTimeAsync(999);
            expect(sendRequest).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(1);
            expect(sendRequest).toHaveBeenCalledTimes(2);
            await vi.advanceTimersByTimeAsync(3000);
            await expect(pending).resolves.toMatchObject({ id: 'u1' });
            expect(sendRequest).toHaveBeenCalledTimes(3);
        } finally {
            vi.useRealTimers();
        }
    });

    it('gives up after two retries and does not retry other errors', async () => {
        vi.useFakeTimers();
        try {
            sendRequest.mockRejectedValue(conflict());
            const pending = run({ action: addOrRemoveUserLicenseAction, props: { userId: 'u1', addLicenses: [{ skuId: 's1' }] } }).catch((e: unknown) => e);
            await vi.advanceTimersByTimeAsync(5000);
            const err = await pending;
            expect(err instanceof Error ? err.message : '').toContain('(409): Directory_ConcurrencyViolation');
            expect(sendRequest).toHaveBeenCalledTimes(3);
        } finally {
            vi.useRealTimers();
        }
        sendRequest.mockReset();
        sendRequest.mockRejectedValueOnce(new HttpError(undefined, { status: 400, responseBody: { error: { code: 'Request_BadRequest', message: 'usageLocation' } } }));
        await expect(run({ action: addOrRemoveUserLicenseAction, props: { userId: 'u1', addLicenses: [{ skuId: 's1' }] } })).rejects.toThrow(/\(400\)/);
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });
});

describe('license pickers', () => {
    it('merges picked licenses with the JSON inputs and sends the exact body', async () => {
        respond({ body: { id: 'u1' } });
        await run({ action: addOrRemoveUserLicenseAction, props: {
            userId: 'u1',
            licensesToAdd: ['s1', 's2'],
            licensesToRemove: ['s9', 's8'],
            addLicenses: [{ skuId: 's1', disabledPlans: ['p1'] }],
            removeLicenses: ['s8'],
        } });
        expect(call({ index: 0 })).toEqual({
            method: 'POST',
            url: `${G}/users/u1/assignLicense`,
            headers: expect.anything(),
            body: { addLicenses: [{ skuId: 's1', disabledPlans: ['p1'] }, { skuId: 's2' }], removeLicenses: ['s8', 's9'] },
        });
    });

    it('works with only the pickers, and refuses empty or conflicting input', () => {
        expect(buildAssignLicenseBody({ addLicenses: [], removeLicenses: [], licensesToAdd: ['s1'], licensesToRemove: undefined })).toEqual({ addLicenses: [{ skuId: 's1' }], removeLicenses: [] });
        expect(() => buildAssignLicenseBody({ addLicenses: [], removeLicenses: [], licensesToAdd: [], licensesToRemove: [] })).toThrow(/at least one/);
        expect(() => buildAssignLicenseBody({ addLicenses: [], removeLicenses: ['s1'], licensesToAdd: ['s1'], licensesToRemove: [] })).toThrow(/added and removed/);
        expect(() => buildAssignLicenseBody({ addLicenses: [{ disabledPlans: [] }], removeLicenses: [], licensesToAdd: [], licensesToRemove: [] })).toThrow(/entry 1 needs a "skuId"/);
    });

    it('labels SKUs by friendly name and free seats', () => {
        expect(skuLabel({ skuId: 'x', skuPartNumber: 'SPE_E3', consumedUnits: 3, prepaidUnits: { enabled: 5 } })).toBe('Microsoft 365 E3 · 2 available');
        expect(skuLabel({ skuId: 'x', skuPartNumber: 'UNKNOWN_SKU', consumedUnits: 9, prepaidUnits: { enabled: 5 } })).toBe('UNKNOWN_SKU · 0 available');
    });

    it('license dropdown loads subscribed SKUs with skuId values', async () => {
        respond({ body: { value: [{ skuId: 's1', skuPartNumber: 'ENTERPRISEPACK', consumedUnits: 1, prepaidUnits: { enabled: 3 } }] } });
        const ctx = createMockActionContext({ propsValue: {} });
        const res = await addOrRemoveUserLicenseAction.props.licensesToAdd.options({ auth: AUTH }, { server: ctx.server, project: ctx.project, flows: ctx.flows, connections: ctx.connections });
        expect(call({ index: 0 }).url).toBe(`${G}/subscribedSkus`);
        expect(res.options).toEqual([{ label: 'Office 365 E3 · 2 available', value: 's1' }]);
    });
});

describe('UI metadata', () => {
    const actions = Object.values(azureAd.actions());

    it('keeps the old license props, in Advanced', () => {
        const props = addOrRemoveUserLicenseAction.props;
        expect(Object.keys(props)).toEqual(['userId', 'licensesToAdd', 'licensesToRemove', 'addLicenses', 'removeLicenses']);
        expect(props.addLicenses.advanced).toBe(true);
        expect(props.removeLicenses.advanced).toBe(true);
    });

    it('puts required props first in Create Group, with short card subtitles', () => {
        expect(Object.keys(createGroupAction.props).slice(0, 3)).toEqual(['displayName', 'mailNickname', 'description']);
        for (const o of createGroupAction.props.groupType.options.options) {
            expect((o.description ?? '').length).toBeLessThanOrEqual(30);
        }
    });

    it('never hides a required prop in Advanced, and keeps descriptions short', () => {
        for (const a of actions) {
            expect(a.description.length, a.name).toBeLessThanOrEqual(110);
            for (const [key, prop] of Object.entries(a.props)) {
                if (prop.required) expect(prop.advanced ?? false, `${a.name}.${key}`).toBe(false);
                expect((prop.description ?? '').length, `${a.name}.${key}`).toBeLessThanOrEqual(150);
            }
        }
    });

    it('moves secondary fields to Advanced', () => {
        const advanced = ({ name, key }: { name: string; key: string }) => actions.find((a) => a.name === name)?.props[key]?.advanced === true;
        expect(advanced({ name: 'list_users', key: 'top' })).toBe(true);
        expect(advanced({ name: 'list_users', key: 'filter' })).toBe(true);
        expect(advanced({ name: 'list_group_members', key: 'top' })).toBe(true);
        expect(advanced({ name: 'get_enabled_users', key: 'top' })).toBe(true);
        expect(advanced({ name: 'list_user_groups', key: 'limit' })).toBe(true);
        expect(advanced({ name: 'list_groups', key: 'limit' })).toBe(true);
        expect(advanced({ name: 'list_groups', key: 'name' })).toBe(false);
        expect(advanced({ name: 'reset_custom_attributes', key: 'extensionNames' })).toBe(true);
    });

    it('groups Create User names in a half-width section with placeholders', () => {
        expect(createUserForUi.propertyGroups).toEqual([{ key: 'name', display: 'section', label: 'Name', icon: 'user', props: ['givenName', 'surname'] }]);
        expect(createUserForUi.props.givenName.width).toBe('half');
        expect(createUserForUi.props.password.placeholder).toBe('At least 8 chars, mixed');
    });

    it('uses Microsoft Entra ID naming everywhere except the piece name', () => {
        for (const a of actions) {
            for (const text of [a.description, a.aiMetadata?.description ?? '']) {
                expect(text, a.name).not.toMatch(/Azure AD|Azure Active Directory/);
            }
        }
        for (const t of Object.values(azureAd.triggers())) {
            expect(`${t.description} ${t.aiMetadata?.description ?? ''}`).not.toMatch(/Azure AD|Azure Active Directory/);
        }
    });
});

describe('create_group', () => {
    it('Microsoft 365 type sends Unified, mail enabled, not security enabled', async () => {
        respond({ body: { id: 'g1' } });
        await run({ action: createGroupAction, props: { displayName: 'Team', mailNickname: 'team', groupType: 'microsoft365', securityEnabled: true } });
        expect(call({ index: 0 })).toMatchObject({ method: 'POST', url: `${G}/groups`, body: { displayName: 'Team', mailNickname: 'team', groupTypes: ['Unified'], mailEnabled: true, securityEnabled: false } });
    });

    it('Security type forces security enabled and mail disabled', async () => {
        respond({ body: { id: 'g1' } });
        await run({ action: createGroupAction, props: { displayName: 'Team', mailNickname: 'team', groupType: 'security', mailEnabled: true, securityEnabled: false } });
        expect(call({ index: 0 })).toMatchObject({ method: 'POST', url: `${G}/groups` });
        expect(call({ index: 0 }).body).toEqual({ displayName: 'Team', mailEnabled: false, securityEnabled: true, mailNickname: 'team' });
    });

    it('empty type uses the checkboxes as given', async () => {
        respond({ body: { id: 'g1' } });
        await run({ action: createGroupAction, props: { displayName: 'Team', mailNickname: 'team', groupType: '', mailEnabled: true, securityEnabled: false } });
        expect(call({ index: 0 }).body).toEqual({ displayName: 'Team', mailEnabled: true, securityEnabled: false, mailNickname: 'team' });
    });

    it('without a type keeps the old flag behaviour', async () => {
        respond({ body: { id: 'g1' } });
        await run({ action: createGroupAction, props: { displayName: 'Team', mailNickname: 'team' } });
        expect(call({ index: 0 }).body).toEqual({ displayName: 'Team', mailEnabled: false, securityEnabled: true, mailNickname: 'team' });
    });

    it('strips @odata keys from user output', async () => {
        respond({ body: { '@odata.context': 'x', id: 'u1' } });
        const out = await run({ action: getUserByIdAction, props: { userId: 'u1' } });
        expect(Object.keys(out instanceof Object ? out : {}).some((k) => k.startsWith('@odata.'))).toBe(false);
    });
});

describe('list_subscribed_skus', () => {
    it('computes available units', async () => {
        respond({ body: { value: [{ skuId: 's1', skuPartNumber: 'E3', capabilityStatus: 'Enabled', consumedUnits: 3, prepaidUnits: { enabled: 5 }, servicePlans: [{ servicePlanId: 'p1', servicePlanName: 'EXO' }] }] } });
        const out = await run({ action: listSubscribedSkusAction, props: {} });
        expect(call({ index: 0 }).url).toBe(`${G}/subscribedSkus`);
        expect(out).toEqual({ items: [{ skuId: 's1', skuPartNumber: 'E3', capabilityStatus: 'Enabled', enabledUnits: 5, consumedUnits: 3, availableUnits: 2, servicePlans: [{ servicePlanId: 'p1', servicePlanName: 'EXO', provisioningStatus: null, appliesTo: null }] }] });
    });
});

describe('extension attributes', () => {
    it('get_group_custom_attributes discovers names and $selects them', async () => {
        respond({ body: { value: [{ name: EXT, targetObjects: ['User', 'Group'] }, { name: 'extension_x_userOnly', targetObjects: ['User'] }] } });
        respond({ body: { id: 'g1', displayName: 'Fin', [EXT]: 'CC-1' } });
        const out = await run({ action: getGroupCustomAttributesAction, props: { groupId: 'g1' } });
        expect(call({ index: 0 })).toMatchObject({ method: 'POST', url: `${G}/directoryObjects/getAvailableExtensionProperties`, body: { isSyncedFromOnPremises: false } });
        expect(call({ index: 1 }).url).toBe(`${G}/groups/g1?$select=id,displayName,${EXT}`);
        expect(out).toEqual({ group_id: 'g1', group_displayName: 'Fin', extension_attribute_names: EXT, [EXT]: 'CC-1', attributes: { [EXT]: 'CC-1' } });
    });

    it('reset_custom_attributes with names $selects them and PATCHes null', async () => {
        respond({ body: { id: 'u1', [EXT]: 'CC-1' } });
        respond({ body: undefined, status: 204 });
        const out = await run({ action: resetCustomAttributesAction, props: { resourceType: 'users', resourceId: 'u1', extensionNames: `${EXT}, ${EXT}` } });
        expect(call({ index: 0 }).url).toBe(`${G}/users/u1?$select=id,${EXT}`);
        expect(call({ index: 1 })).toMatchObject({ method: 'PATCH', url: `${G}/users/u1`, body: { [EXT]: null } });
        expect(out).toMatchObject({ success: true, id: 'u1', cleared: [EXT] });
    });

    it('reset_custom_attributes with no names clears only attributes that have a value', async () => {
        const other = 'extension_0123456789abcdef0123456789abcdef_empty';
        respond({ body: { value: [{ name: EXT, targetObjects: ['User'] }, { name: other, targetObjects: ['User'] }] } });
        respond({ body: { id: 'u1', [EXT]: 'CC-1', [other]: null } });
        respond({ body: undefined, status: 204 });
        const out = await run({ action: resetCustomAttributesAction, props: { resourceType: 'users', resourceId: 'u1' } });
        expect(call({ index: 1 }).url).toBe(`${G}/users/u1?$select=id,${EXT},${other}`);
        expect(call({ index: 2 }).body).toEqual({ [EXT]: null });
        expect(out).toMatchObject({ cleared: [EXT] });
    });
});

describe('capped lists', () => {
    it('list_enabled_users throws past 50 pages instead of looping forever', async () => {
        sendRequest.mockImplementation(async () => ({ status: 200, headers: {}, body: { value: [{ id: 'u' }], '@odata.nextLink': `${G}/users?$skiptoken=n` } }));
        await expect(run({ action: listEnabledUsersAction, props: {} })).rejects.toThrow(/More than 50 pages/);
        expect(sendRequest).toHaveBeenCalledTimes(50);
    });

    it('list_group_members follows pages only when All Pages is on', async () => {
        respond({ body: { value: [{ id: 'a', '@odata.type': '#microsoft.graph.user' }], '@odata.nextLink': `${G}/groups/g1/members?$skiptoken=n` } });
        expect(await run({ action: listGroupMembersAction, props: { groupId: 'g1' } })).toEqual([{ id: 'a', '@odata.type': '#microsoft.graph.user', objectType: 'user' }]);
        respond({ body: { value: [{ id: 'a' }], '@odata.nextLink': `${G}/groups/g1/members?$skiptoken=n` } });
        respond({ body: { value: [{ id: 'b' }] } });
        const all = await run({ action: listGroupMembersAction, props: { groupId: 'g1', allPages: true } });
        expect(all).toEqual([{ id: 'a', objectType: null }, { id: 'b', objectType: null }]);
        expect(call({ index: 2 }).url).toBe(`${G}/groups/g1/members?$skiptoken=n`);
    });
});

describe('update user sign-in', () => {
    it('leaves sign-in alone when the field is empty or false, and maps yes/no', async () => {
        respond({ body: {} });
        respond({ body: { id: 'u1' } });
        await run({ action: updateUserAction, props: { userId: 'u1', jobTitle: 'Lead', accountEnabled: false } });
        expect(call({ index: 0 }).body).toEqual({ jobTitle: 'Lead' });
        expect(call({ index: 1 }).url).toContain('accountEnabled');
        respond({ body: {} });
        respond({ body: { id: 'u1' } });
        await run({ action: updateUserAction, props: { userId: 'u1', accountEnabled: 'no' } });
        expect(call({ index: 2 }).body).toEqual({ accountEnabled: false });
        respond({ body: {} });
        respond({ body: { id: 'u1' } });
        await run({ action: updateUserAction, props: { userId: 'u1', accountEnabled: 'yes' } });
        expect(call({ index: 4 }).body).toEqual({ accountEnabled: true });
    });

    it('refuses an update with no fields', async () => {
        await expect(run({ action: updateUserAction, props: { userId: 'u1', accountEnabled: false } })).rejects.toThrow('at least one field');
    });
});
