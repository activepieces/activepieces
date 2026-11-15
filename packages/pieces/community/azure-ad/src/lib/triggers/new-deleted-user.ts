import { HttpMethod } from '@activepieces/pieces-common';
import { Store, TriggerStrategy, createTrigger, isNil } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { callGraphApi, DirectoryObject, getHttpErrorStatus, NEW_OBJECT_LAG_MS, NEW_OBJECT_SEEN_CAP, readDeltaChanges, seedDeltaLink } from '../common';

const STATE_KEY = '_new_deleted_user_state';
const LEGACY_STORE_KEY = '_delta_link_new_deleted_user';
const USER_SELECT = 'id,displayName,userPrincipalName,mail,givenName,surname';
const LOOKUP_CAP = 100;

export const newDeletedUserTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_deleted_user',
    classification: 'READ',
    displayName: 'New Deleted User',
    description: 'Triggers when a user is deleted from Microsoft Entra ID.',
    aiMetadata: {
        description: 'Fires when a user account is removed from Microsoft Entra ID, detected by polling the Microsoft Graph users delta query. Each event is one user with id, displayName, userPrincipalName, mail, givenName, surname, deletedDateTime and removedReason: "changed" means soft-deleted (restorable for 30 days), "deleted" means permanently deleted, in which case the profile fields are null. Profile fields are also null, with profileLookedUp false, for removals past the first 100 in one poll. The same deletion is reported once even if Microsoft Graph repeats it within 24 hours; a soft delete followed by a permanent delete fires twice.',
    },
    type: TriggerStrategy.POLLING,
    props: {},
    outputSchema: {
        fields: [
            { key: 'id', label: 'User ID' },
            { key: 'displayName', label: 'Display Name' },
            { key: 'userPrincipalName', label: 'User Principal Name' },
            { key: 'mail', label: 'Mail', format: 'email' },
            { key: 'givenName', label: 'Given Name' },
            { key: 'surname', label: 'Surname' },
            { key: 'deletedDateTime', label: 'Deleted At', format: 'datetime' },
            { key: 'removedReason', label: 'Removed Reason', description: '"changed" = soft-deleted (restorable), "deleted" = permanently deleted. Profile fields are null for permanent deletes and when more than 100 users are removed in one poll.' },
            { key: 'profileLookedUp', label: 'Profile Looked Up', format: 'boolean', description: 'False when the profile was not fetched because more than 100 users were removed in one poll.' },
        ],
    },
    sampleData: {
        id: '12345678-aaaa-bbbb-cccc-1234567890ab',
        displayName: 'Ada Lovelace',
        userPrincipalName: '12345678aaaabbbbcccc1234567890abada@contoso.onmicrosoft.com',
        mail: 'ada@contoso.com',
        givenName: 'Ada',
        surname: 'Lovelace',
        deletedDateTime: '2026-04-22T10:15:30Z',
        removedReason: 'changed',
        profileLookedUp: true,
    },
    async onEnable(context) {
        if (context.isRepublish && (!isNil(await context.store.get(STATE_KEY)) || !isNil(await context.store.get(LEGACY_STORE_KEY)))) {
            return;
        }
        const deltaLink = await seedDeltaLink({ accessToken: context.auth.access_token, deltaPath: '/users/delta', select: USER_SELECT });
        await context.store.put<DeletedUserState>(STATE_KEY, { deltaLink, seen: [] });
    },
    async onDisable(context) {
        if (context.isRepublish) {
            return;
        }
        await context.store.delete(STATE_KEY);
        await context.store.delete(LEGACY_STORE_KEY);
    },
    async test(context) {
        const res = await callGraphApi<{ value?: Record<string, unknown>[] }>(context.auth.access_token, {
            method: HttpMethod.GET,
            url: '/directory/deletedItems/microsoft.graph.user',
            query: { $select: `${USER_SELECT},deletedDateTime`, $top: '5' },
        });
        return (res.value ?? []).map((u) => toDeletedUser({ id: String(u['id']), profile: u, reason: 'changed', profileLookedUp: true }));
    },
    async run(context) {
        const token = context.auth.access_token;
        const startedAt = Date.now();
        const state = await loadState({ store: context.store });
        if (state === null) {
            const seeded = await seedDeltaLink({ accessToken: token, deltaPath: '/users/delta', select: USER_SELECT });
            await context.store.put<DeletedUserState>(STATE_KEY, { deltaLink: seeded, seen: [] });
            return [];
        }
        const { items, deltaLink } = await readDeltaChanges<DirectoryObject>({ accessToken: token, url: state.deltaLink });
        const removed = items.filter((item) => item['@removed'] !== undefined && typeof item.id === 'string');
        const seenKeys = new Set(state.seen.map((s) => s.key));
        const events: DeletedUser[] = [];
        const newlySeen: { key: string; at: number }[] = [];
        for (const [index, item] of removed.entries()) {
            const reason = typeof item['@removed']?.reason === 'string' ? item['@removed'].reason : null;
            const profileLookedUp = index < LOOKUP_CAP;
            const profile = profileLookedUp ? await lookupDeletedUser({ accessToken: token, id: item.id }) : null;
            const event = toDeletedUser({ id: item.id, profile, reason, profileLookedUp });
            const key = dedupeKey(event);
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);
            newlySeen.push({ key, at: startedAt });
            events.push(event);
        }
        const seen = [...state.seen, ...newlySeen]
            .filter((s) => s.at >= startedAt - NEW_OBJECT_LAG_MS)
            .slice(-NEW_OBJECT_SEEN_CAP);
        await context.store.put<DeletedUserState>(STATE_KEY, { deltaLink, seen });
        return events;
    },
});

async function loadState({ store }: { store: Store }): Promise<DeletedUserState | null> {
    const state = await store.get<DeletedUserState>(STATE_KEY);
    if (state !== null) return state;
    const legacy = await store.get<string>(LEGACY_STORE_KEY);
    if (typeof legacy !== 'string' || legacy === '') return null;
    return { deltaLink: legacy, seen: [] };
}

function dedupeKey(event: DeletedUser): string {
    return `${event.id}|${event.deletedDateTime ?? event.removedReason ?? ''}`;
}

async function lookupDeletedUser({ accessToken, id }: { accessToken: string; id: string }): Promise<Record<string, unknown> | null> {
    try {
        return await callGraphApi<Record<string, unknown>>(accessToken, {
            method: HttpMethod.GET,
            url: `/directory/deletedItems/${encodeURIComponent(id)}`,
            query: { $select: `${USER_SELECT},deletedDateTime` },
        });
    } catch (error) {
        if (getHttpErrorStatus(error) === 404) return null;
        throw error;
    }
}

function toDeletedUser({ id, profile, reason, profileLookedUp }: { id: string; profile: Record<string, unknown> | null; reason: string | null; profileLookedUp: boolean }): DeletedUser {
    const field = (key: string): string | null => {
        const v = profile?.[key];
        return typeof v === 'string' ? v : null;
    };
    return {
        id,
        displayName: field('displayName'),
        userPrincipalName: field('userPrincipalName'),
        mail: field('mail'),
        givenName: field('givenName'),
        surname: field('surname'),
        deletedDateTime: field('deletedDateTime'),
        removedReason: reason,
        profileLookedUp,
    };
}

type DeletedUser = {
    id: string;
    displayName: string | null;
    userPrincipalName: string | null;
    mail: string | null;
    givenName: string | null;
    surname: string | null;
    deletedDateTime: string | null;
    removedReason: string | null;
    profileLookedUp: boolean;
};

type DeletedUserState = {
    deltaLink: string;
    seen: { key: string; at: number }[];
};
